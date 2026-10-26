import { v4 as uuidv4 } from 'uuid';
import { GAP_RULES, ORDER_RULES, STEP_LIBRARY, createStep, sectorById } from '../data/agacStandards';

/* ---------------- Tag / loop helpers ---------------- */

// ISA-5.1 style tag: 2-4 letters, dash, 3-5 digits, optional suffix letter  (TT-101, PSV-2001A)
const TAG_RE = /^[A-Z]{1,5}-\d{2,5}[A-Z]?$/;
export const isValidTag = (tag) => TAG_RE.test((tag || '').trim());

export function loopCheckPoints(point, testPointsStr = '0,25,50,75,100') {
  const min = Number(point.min);
  const max = Number(point.max);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  const pcts = String(testPointsStr)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  const span = max - min;
  return pcts.map((pct) => {
    const value = min + (span * pct) / 100;
    const mA = 4 + (16 * pct) / 100;
    return { pct, value: +value.toFixed(3), mA: +mA.toFixed(2) };
  });
}

export const allIoPoints = (steps) => {
  const seen = new Map();
  steps.forEach((s) => (s.config?.ioPoints || []).forEach((p) => p.tag && !seen.has(p.tag) && seen.set(p.tag, p)));
  return [...seen.values()];
};

export const allInterlocks = (steps) => {
  const out = [];
  steps.forEach((s) => (s.config?.interlocks || []).forEach((i) => out.push({ ...i, stepId: s.id, stepName: s.name })));
  return out;
};

export function evalInterlock(il, value) {
  const v = Number(value);
  const t = Number(il.value);
  if (il.op === '>') return v > t;
  if (il.op === '<') return v < t;
  if (il.op === '==') return v === t;
  return false;
}

// A process value that violates the interlock (used by simulator & scenario buttons)
export function violatingValue(il, point) {
  const t = Number(il.value);
  const span = point ? Math.abs(Number(point.max) - Number(point.min)) || 1 : Math.abs(t) || 1;
  if (il.op === '>') return +(t + span * 0.05).toFixed(3);
  if (il.op === '<') return +(t - span * 0.05).toFixed(3);
  return t;
}

/* ---------------- Sequence validation (real-time) ---------------- */

const firstIndex = (steps, key) => steps.findIndex((s) => s.key === key);

export function orderViolations(steps) {
  const byStep = {};
  const list = [];
  ORDER_RULES.forEach((rule) => {
    const b = firstIndex(steps, rule.before);
    const a = firstIndex(steps, rule.after);
    if (b === -1 || a === -1) return;
    if (a < b) {
      const afterStep = steps[a];
      const beforeStep = steps[b];
      const text = `${rule.msg} ("${afterStep.name}" is placed before "${beforeStep.name}")`;
      (byStep[afterStep.id] ||= []).push(text);
      (byStep[beforeStep.id] ||= []).push(text);
      list.push({ ...rule, afterStep, beforeStep, text });
    }
  });
  return { byStep, list };
}

/* ---------------- Gap detector ---------------- */

export function suggestInsertIndex(steps, key) {
  // Must come before the earliest step that requires it.
  let idx = steps.length;
  ORDER_RULES.filter((r) => r.before === key).forEach((r) => {
    const i = firstIndex(steps, r.after);
    if (i !== -1 && i < idx) idx = i;
  });
  // Must come after the latest step it depends on.
  let min = 0;
  ORDER_RULES.filter((r) => r.after === key).forEach((r) => {
    const i = firstIndex(steps, r.before);
    if (i !== -1 && i + 1 > min) min = i + 1;
  });
  if (idx === steps.length) {
    // append, but keep handover steps last
    const h = firstIndex(steps, 'handover');
    if (h !== -1) idx = h;
  }
  return Math.max(min, Math.min(idx, steps.length));
}

export function insertStepByKey(steps, key) {
  const at = suggestInsertIndex(steps, key);
  const next = [...steps];
  next.splice(at, 0, createStep(key));
  return next;
}

export function analyzeWorkflow(steps, sectorId) {
  const issues = [];
  const keys = new Set(steps.map((s) => s.key));

  // 1. Missing steps
  GAP_RULES.forEach((rule) => {
    const applies = rule.sectors.includes('*') || rule.sectors.includes(sectorId);
    if (applies && !keys.has(rule.key)) {
      issues.push({
        id: `missing-${rule.key}`,
        type: 'missing',
        severity: rule.severity,
        title: rule.title,
        detail: rule.detail,
        standard: rule.standard,
        fixKey: rule.key,
        fixLabel: `Add "${STEP_LIBRARY.find((s) => s.key === rule.key)?.name || rule.key}"`,
      });
    }
  });

  // 2. Wrong sequence
  orderViolations(steps).list.forEach((v) => {
    issues.push({
      id: `order-${v.before}-${v.after}`,
      type: 'order',
      severity: 'critical',
      title: 'Incorrect sequence',
      detail: v.text,
      standard: v.standard,
      stepIds: [v.afterStep.id, v.beforeStep.id],
    });
  });

  // 3. Configuration heuristics
  const io = allIoPoints(steps);
  const ils = allInterlocks(steps);
  const step = (k) => steps.find((s) => s.key === k);

  const ioStep = step('io_list');
  if (ioStep && (ioStep.config.ioPoints || []).length === 0) {
    issues.push({ id: 'cfg-io-empty', type: 'config', severity: 'warning', title: 'I/O list step has no signals', detail: 'Add I/O points in the Configure tab so loop checks, FAT and simulation can use them.', standard: 'ISA-5.1', stepIds: [ioStep.id] });
  }

  const dupTags = new Set();
  const tagSeen = new Set();
  steps.forEach((s) => (s.config?.ioPoints || []).forEach((p) => {
    if (tagSeen.has(p.tag)) dupTags.add(p.tag);
    tagSeen.add(p.tag);
  }));
  if (dupTags.size) {
    issues.push({ id: 'cfg-dup-tags', type: 'config', severity: 'critical', title: 'Duplicate tags in I/O list', detail: `Tags defined more than once: ${[...dupTags].join(', ')}.`, standard: 'ISA-5.1' });
  }

  const badTags = io.filter((p) => !isValidTag(p.tag)).map((p) => p.tag || '(blank)');
  if (badTags.length) {
    issues.push({ id: 'cfg-bad-tags', type: 'config', severity: 'warning', title: 'Tags not following ISA-5.1 pattern', detail: `Check: ${badTags.slice(0, 8).join(', ')}${badTags.length > 8 ? '…' : ''}. Expected like TT-101 or PSV-2001A.`, standard: 'ISA-5.1' });
  }

  const ilStep = step('interlock_logic');
  if (ilStep && ils.length === 0) {
    issues.push({ id: 'cfg-il-empty', type: 'config', severity: 'warning', title: 'Interlock step has no interlocks defined', detail: 'Define interlocks (tag, condition, action) so they can be verified in the simulator and FAT.', standard: 'IEC 61511', stepIds: [ilStep.id] });
  }

  const unmapped = ils.filter((i) => !io.some((p) => p.tag === i.tag));
  if (unmapped.length) {
    issues.push({ id: 'cfg-il-unmapped', type: 'config', severity: 'critical', title: 'Interlock references tags missing from the I/O list', detail: `Unmapped: ${[...new Set(unmapped.map((i) => i.tag))].join(', ')}.`, standard: 'IEC 61511' });
  }

  const outOfRange = ils.filter((i) => {
    const p = io.find((x) => x.tag === i.tag);
    if (!p || i.op === '==') return false;
    const t = Number(i.value);
    return t < Number(p.min) || t > Number(p.max);
  });
  if (outOfRange.length) {
    issues.push({ id: 'cfg-il-range', type: 'config', severity: 'warning', title: 'Interlock set-point outside instrument range', detail: `Check: ${outOfRange.map((i) => i.tag).join(', ')} - the trip can never occur.`, standard: 'IEC 61511' });
  }

  const net = step('network_arch');
  if (net && !net.config.network.protocol) {
    issues.push({ id: 'cfg-net', type: 'config', severity: 'info', title: 'Network architecture has no protocol selected', detail: 'Select the field / supervisory protocol (Profinet, Modbus, IEC 61850…).', standard: 'IEC 62443', stepIds: [net.id] });
  }

  const loop = step('loop_check');
  if (loop && io.filter((p) => p.type === 'AI' || p.type === 'AO').length === 0) {
    issues.push({ id: 'cfg-loop', type: 'config', severity: 'info', title: 'Loop check has no analog points to verify', detail: 'No AI/AO signals are defined in the I/O list.', standard: 'IEC 62381', stepIds: [loop.id] });
  }

  if (sectorId === 'oil_gas') {
    const esdIl = ils.some((i) => i.action === 'ESD');
    if (!esdIl) {
      issues.push({ id: 'cfg-esd', type: 'config', severity: 'critical', title: 'No ESD-class interlock defined', detail: 'Oil & Gas facilities require at least one defined emergency shutdown function (e.g. PAHH, gas detection).', standard: 'IEC 61511' });
    }
  }

  // 4. Sign-off hygiene on test steps
  const testKeys = ['fat', 'sat', 'loop_check', 'esd_verification', 'cold_commissioning', 'hot_commissioning', 'performance_test', 'handover'];
  const noSign = steps.filter((s) => testKeys.includes(s.key) && !s.config?.signoff?.engineer && !s.config?.signoff?.client);
  if (noSign.length) {
    issues.push({ id: 'cfg-signoff', type: 'config', severity: 'info', title: 'Test / acceptance steps without sign-off responsibilities', detail: `Assign engineer and client witness for: ${noSign.map((s) => s.name).join('; ')}.`, standard: 'IEC 62381', stepIds: noSign.map((s) => s.id) });
  }

  const sev = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => sev[a.severity] - sev[b.severity]);

  const weights = { critical: 8, warning: 3, info: 1 };
  const penalty = issues.reduce((n, i) => n + weights[i.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return { issues, score, sector: sectorById(sectorId)?.name || 'Generic' };
}

export const newId = () => uuidv4();
