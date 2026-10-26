import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertOctagon, AlertTriangle, Ban, CheckCircle2, CircleDashed, Loader2, Play, PlayCircle, RefreshCw, RotateCcw, ShieldAlert, SkipForward, Siren, WifiOff, Zap,
} from 'lucide-react';
import { ORDER_RULES, phaseById } from '../data/agacStandards';
import { allInterlocks, allIoPoints, evalInterlock, loopCheckPoints, violatingValue } from '../utils/validation';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clock = () => new Date().toLocaleTimeString('en-GB');
const num = (v) => Number(v);

/** A nominal, safe operating value: inside range, clear of every interlock set-point. */
function safeValue(point, interlocks) {
  const mine = interlocks.filter((i) => i.tag === point.tag);
  if (point.type === 'DI' || point.type === 'DO') {
    return [0, 1].find((v) => !mine.some((i) => evalInterlock(i, v))) ?? 0;
  }
  const min = num(point.min);
  const max = num(point.max);
  const span = max - min || 1;
  const cands = [];
  for (let p = 5; p <= 95; p += 5) cands.push(min + (span * p) / 100);
  const ok = cands.filter((v) => !mine.some((i) => evalInterlock(i, v)));
  if (ok.length === 0) return +(min + span / 2).toFixed(3);
  const margin = (v) => Math.min(Infinity, ...mine.map((i) => Math.abs(num(i.value) - v) / span));
  const roomy = ok.filter((v) => margin(v) >= 0.1);
  const pool = roomy.length ? roomy : ok;
  const mid = min + span / 2;
  pool.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
  return +pool[0].toFixed(3);
}

const STATUS = {
  pending: { icon: CircleDashed, cls: 'text-zinc-500', label: 'Pending' },
  running: { icon: Loader2, cls: 'text-cyan-300 animate-spin', label: 'Running' },
  passed: { icon: CheckCircle2, cls: 'text-emerald-400', label: 'Passed' },
  failed: { icon: AlertOctagon, cls: 'text-red-400', label: 'Failed' },
  blocked: { icon: Ban, cls: 'text-amber-400', label: 'Blocked' },
};

const ACTION_CLS = {
  ALARM: 'border-amber-500/60 bg-amber-500/15 text-amber-300',
  TRIP: 'border-orange-500/60 bg-orange-500/15 text-orange-300',
  ESD: 'border-red-500/70 bg-red-500/20 text-red-300',
};

export default function WorkflowSimulator({ steps }) {
  const io = useMemo(() => allIoPoints(steps), [steps]);
  const interlocks = useMemo(() => allInterlocks(steps), [steps]);

  const [tags, setTags] = useState({});
  const [commsLost, setCommsLost] = useState(false);
  const [drift, setDrift] = useState(false);
  const [injectFault, setInjectFault] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [latched, setLatched] = useState([]); // interlock ids latched (TRIP / ESD)
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [trendTag, setTrendTag] = useState('');
  const [history, setHistory] = useState({});

  const statusRef = useRef({});
  const tagsRef = useRef({});
  const cancelRef = useRef(false);
  const prevActive = useRef(new Set());
  const logEnd = useRef(null);

  tagsRef.current = tags;
  statusRef.current = statuses;

  const addLog = useCallback((level, msg) => {
    setLog((l) => [...l.slice(-300), { t: clock(), level, msg }]);
  }, []);

  /* ---- keep tag table in sync with I/O list ---- */
  const ioKey = io.map((p) => `${p.tag}|${p.type}|${p.min}|${p.max}`).join(';');
  const ilKey = interlocks.map((i) => `${i.tag}${i.op}${i.value}`).join(';');
  useEffect(() => {
    setTags((prev) => {
      const next = {};
      io.forEach((p) => {
        next[p.tag] = p.tag in prev ? prev[p.tag] : safeValue(p, interlocks);
      });
      return next;
    });
    setTrendTag((t) => (io.some((p) => p.tag === t) ? t : io.find((p) => p.type === 'AI')?.tag || io[0]?.tag || ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ioKey, ilKey]);

  /* ---- live interlock evaluation ---- */
  const active = useMemo(() => {
    if (commsLost) return [];
    return interlocks.filter((i) => i.tag in tags && evalInterlock(i, tags[i.tag]));
  }, [interlocks, tags, commsLost]);

  useEffect(() => {
    const now = new Set(active.map((i) => i.id));
    active.forEach((i) => {
      if (!prevActive.current.has(i.id)) {
        addLog(i.action === 'ALARM' ? 'warn' : 'error', `${i.action}: ${i.tag} ${i.op} ${i.value} - ${i.description || 'interlock active'}`);
        if (i.action !== 'ALARM') setLatched((l) => (l.includes(i.id) ? l : [...l, i.id]));
      }
    });
    interlocks.forEach((i) => {
      if (prevActive.current.has(i.id) && !now.has(i.id)) addLog('info', `RTN: ${i.tag} returned to normal (${i.action} condition cleared)`);
    });
    prevActive.current = now;
  }, [active, interlocks, addLog]);

  useEffect(() => {
    logEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [log]);

  /* ---- 1 s tick: optional drift + trend sampling ---- */
  useEffect(() => {
    const id = setInterval(() => {
      setTags((prev) => {
        if (!drift || commsLost) return prev;
        const next = { ...prev };
        io.forEach((p) => {
          if (p.type !== 'AI') return;
          const span = num(p.max) - num(p.min) || 1;
          const v = num(prev[p.tag]) + (Math.random() - 0.5) * span * 0.01;
          next[p.tag] = +Math.min(num(p.max), Math.max(num(p.min), v)).toFixed(3);
        });
        return next;
      });
      setHistory((h) => {
        const out = { ...h };
        const cur = tagsRef.current;
        Object.keys(cur).forEach((k) => {
          const arr = out[k] ? [...out[k], num(cur[k])] : [num(cur[k])];
          out[k] = arr.slice(-60);
        });
        return out;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [drift, commsLost, io]);

  useEffect(() => () => { cancelRef.current = true; }, []);

  /* ---------------- scenarios ---------------- */
  const setTag = (tag, v) => setTags((t) => ({ ...t, [tag]: v }));

  const scenarioNormal = () => {
    const next = {};
    io.forEach((p) => (next[p.tag] = safeValue(p, interlocks)));
    setTags(next);
    setCommsLost(false);
    addLog('info', 'Scenario: all tags restored to nominal operating values.');
  };

  const scenarioExcursion = () => {
    const next = { ...tagsRef.current };
    interlocks.forEach((i) => {
      const p = io.find((x) => x.tag === i.tag);
      if (p) next[i.tag] = violatingValue(i, p);
    });
    setTags(next);
    addLog('warn', 'Scenario: process excursion injected on every interlocked tag.');
  };

  const forceInterlock = (i) => {
    const p = io.find((x) => x.tag === i.tag);
    if (!p) return addLog('error', `Cannot force ${i.tag}: tag is not mapped in the I/O list.`);
    setTag(i.tag, violatingValue(i, p));
  };

  const toggleComms = () => {
    setCommsLost((c) => {
      addLog(c ? 'info' : 'error', c ? 'Communications restored - tag quality GOOD.' : 'COMMS FAIL: controller link lost - tag quality BAD, interlock evaluation suspended on SCADA.');
      return !c;
    });
  };

  const resetLatched = () => {
    const stillActive = new Set(active.map((i) => i.id));
    const blocked = latched.filter((id) => stillActive.has(id));
    if (blocked.length) return addLog('warn', 'Reset refused: initiating condition still present. Clear the process condition first.');
    setLatched([]);
    addLog('ok', 'Trip / ESD reset accepted by operator.');
  };

  /* ---------------- step execution ---------------- */
  const setStatus = (id, s) => {
    statusRef.current = { ...statusRef.current, [id]: s };
    setStatuses(statusRef.current);
  };

  const prerequisites = (step) => {
    const missing = [];
    ORDER_RULES.filter((r) => r.after === step.key).forEach((r) => {
      const dep = steps.find((s) => s.key === r.before);
      if (dep && statusRef.current[dep.id] !== 'passed') missing.push(dep);
    });
    return missing;
  };

  const verifyInterlocks = (list, strict) => {
    const lines = [];
    let ok = true;
    if (list.length === 0) {
      lines.push([strict ? 'error' : 'warn', 'No interlocks defined to verify.']);
      return { ok: !strict, lines };
    }
    list.forEach((i) => {
      const p = io.find((x) => x.tag === i.tag);
      if (!p) {
        ok = false;
        lines.push(['error', `${i.tag}: interlock references a tag that is not in the I/O list.`]);
        return;
      }
      if (i.op !== '==' && (num(i.value) < num(p.min) || num(i.value) > num(p.max))) {
        ok = false;
        lines.push(['error', `${i.tag}: set-point ${i.value} is outside instrument range ${p.min}-${p.max}${p.units ? ' ' + p.units : ''}.`]);
        return;
      }
      const bad = violatingValue(i, p);
      const safe = safeValue(p, interlocks);
      const trips = evalInterlock(i, bad);
      const quiet = !evalInterlock(i, safe);
      if (trips && quiet) lines.push(['ok', `${i.tag} ${i.op} ${i.value} → ${i.action}: asserted at ${bad}, clear at ${safe}${p.units ? ' ' + p.units : ''}.`]);
      else {
        ok = false;
        lines.push(['error', `${i.tag} ${i.op} ${i.value}: logic did not behave as expected (assert=${trips}, clear=${quiet}).`]);
      }
    });
    return { ok, lines };
  };

  const loopCheck = (step) => {
    const lines = [];
    let ok = true;
    const analog = io.filter((p) => p.type === 'AI' || p.type === 'AO');
    if (analog.length === 0) return { ok: false, lines: [['error', 'No analog (AI/AO) points defined - nothing to loop check.']] };
    const tol = num(step.config.loopCheck?.tolerance) || 0.5;
    const pts = step.config.loopCheck?.testPoints || '0,25,50,75,100';
    let faultDone = false;
    analog.forEach((p) => {
      const span = num(p.max) - num(p.min) || 1;
      let worst = 0;
      loopCheckPoints(p, pts).forEach((r) => {
        let errPct = (Math.random() * 2 - 1) * tol * 0.7;
        if (injectFault && !faultDone && p.type === 'AI' && r.pct === 50) {
          errPct = tol * 3;
          faultDone = true;
        }
        const reading = r.value + (span * errPct) / 100;
        const abs = Math.abs(errPct);
        worst = Math.max(worst, abs);
        if (abs > tol) {
          ok = false;
          lines.push(['error', `${p.tag} @${r.pct}% (${r.mA} mA): expected ${r.value}, HMI ${reading.toFixed(3)} ${p.units} → error ${errPct.toFixed(2)}% > ±${tol}% FAIL (check scaling / wiring / calibration).`]);
        }
      });
      if (worst <= tol) lines.push(['ok', `${p.tag}: ${loopCheckPoints(p, pts).length} points within ±${tol}% (max ${worst.toFixed(2)}%).`]);
    });
    return { ok, lines };
  };

  const execute = (step) => {
    const lines = [];
    const missing = prerequisites(step);
    if (latched.length) return { status: 'blocked', lines: [['error', `Plant is in TRIP / ESD (latched ${latched.length}). Reset before continuing.`]] };
    if (missing.length) return { status: 'blocked', lines: [['warn', `Prerequisite not passed: ${missing.map((m) => m.name).join('; ')}.`]] };

    const done = step.config.checklist.filter((c) => c.done).length;
    lines.push(['info', `Prerequisites satisfied. Checklist ${done}/${step.config.checklist.length} marked complete.`]);
    if (step.config.signoff?.status === 'rejected') return { status: 'failed', lines: [...lines, ['error', 'Step was marked REJECTED at sign-off.']] };

    let res = { ok: true, lines: [] };
    if (step.key === 'loop_check') res = loopCheck(step);
    else if (step.key === 'esd_verification') res = verifyInterlocks(interlocks.filter((i) => i.action !== 'ALARM'), true);
    else if (step.key === 'interlock_logic') res = verifyInterlocks(interlocks, true);
    else if (['fat', 'sat'].includes(step.key)) res = verifyInterlocks(interlocks, false);
    else if (step.key === 'network_arch' && !step.config.network.protocol) res = { ok: true, lines: [['warn', 'No network protocol selected for this step.']] };
    else if (step.key === 'instrument_calibration') {
      const uncal = io.filter((p) => p.type === 'AI' && !step.config.calibration.some((c) => c.tag === p.tag));
      res = { ok: true, lines: uncal.length ? [['warn', `No calibration record for: ${uncal.map((p) => p.tag).join(', ')}.`]] : [['ok', 'All analog inputs have calibration records.']] };
    } else if (step.key === 'io_list') {
      res = io.length ? { ok: true, lines: [['ok', `${io.length} I/O points mapped (${io.filter((p) => p.type[0] === 'A').length} analog, ${io.filter((p) => p.type[0] === 'D').length} digital).`]] } : { ok: false, lines: [['error', 'I/O list is empty.']] };
    }
    return { status: res.ok ? 'passed' : 'failed', lines: [...lines, ...res.lines] };
  };

  const runOne = async (step, withDelay = true) => {
    setStatus(step.id, 'running');
    addLog('info', `▶ ${step.name}`);
    if (withDelay) await sleep(450);
    const r = execute(step);
    r.lines.forEach(([lvl, msg]) => addLog(lvl, `   ${msg}`));
    setStatus(step.id, r.status);
    addLog(r.status === 'passed' ? 'ok' : r.status === 'blocked' ? 'warn' : 'error', `■ ${step.name}: ${r.status.toUpperCase()}`);
    return r.status;
  };

  const runAll = async () => {
    if (running) return;
    cancelRef.current = false;
    setRunning(true);
    for (const step of steps) {
      if (cancelRef.current) break;
      if (statusRef.current[step.id] === 'passed') continue;
      const s = await runOne(step);
      if (s !== 'passed') break;
    }
    setRunning(false);
  };

  const runNext = async () => {
    if (running) return;
    const next = steps.find((s) => statusRef.current[s.id] !== 'passed');
    if (!next) return addLog('ok', 'All steps already passed.');
    setRunning(true);
    await runOne(next);
    setRunning(false);
  };

  const runSingle = async (step) => {
    if (running) return;
    setRunning(true);
    await runOne(step);
    setRunning(false);
  };

  const stop = () => {
    cancelRef.current = true;
    addLog('warn', 'Run stopped by user.');
  };

  const resetAll = () => {
    cancelRef.current = true;
    setRunning(false);
    setStatuses({});
    statusRef.current = {};
    setLatched([]);
    setLog([]);
    prevActive.current = new Set();
    const next = {};
    io.forEach((p) => (next[p.tag] = safeValue(p, interlocks)));
    setTags(next);
    setCommsLost(false);
    setHistory({});
  };

  /* ---------------- render ---------------- */
  const passed = steps.filter((s) => statuses[s.id] === 'passed').length;
  const plantState = latched.some((id) => interlocks.find((i) => i.id === id)?.action === 'ESD')
    ? 'ESD'
    : latched.length
    ? 'TRIPPED'
    : active.length
    ? 'ALARM'
    : 'NORMAL';
  const plantCls = { ESD: 'border-red-500 bg-red-600/20 text-red-200 blink', TRIPPED: 'border-orange-500 bg-orange-600/20 text-orange-200', ALARM: 'border-amber-500 bg-amber-500/15 text-amber-200', NORMAL: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200' }[plantState];

  if (steps.length === 0) {
    return <div className="panel p-8 text-center text-sm text-zinc-400">Build or load a workflow first, then simulate it here.</div>;
  }

  const trend = history[trendTag] || [];

  return (
    <div className="space-y-4">
      {/* status + controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold tracking-wide ${plantCls}`}>
          {plantState === 'NORMAL' ? <Activity className="h-4 w-4" /> : <Siren className="h-4 w-4" />}
          PLANT: {plantState}
          {commsLost && <span className="chip border-red-500/60 bg-red-500/10 text-red-300"><WifiOff className="h-3 w-3" /> COMMS FAIL</span>}
        </div>
        <span className="text-xs text-zinc-400">{passed}/{steps.length} steps passed</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn btn-primary btn-sm" onClick={runAll} disabled={running}><PlayCircle className="h-4 w-4" /> Run all</button>
          <button className="btn btn-sm" onClick={runNext} disabled={running}><SkipForward className="h-4 w-4" /> Run next</button>
          {running && <button className="btn btn-danger btn-sm" onClick={stop}>Stop</button>}
          <button className="btn btn-sm" onClick={resetAll}><RotateCcw className="h-4 w-4" /> Reset sim</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ---- step runner ---- */}
        <section className="panel min-w-0 p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="panel-title">Step runner · dependency check</h3>
            <label className="flex items-center gap-1.5 text-xs text-zinc-300">
              <input type="checkbox" className="accent-red-500" checked={injectFault} onChange={(e) => setInjectFault(e.target.checked)} />
              Inject loop-check fault
            </label>
          </div>
          <ol className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
            {steps.map((s, i) => {
              const st = statuses[s.id] || 'pending';
              const { icon: Icon, cls, label } = STATUS[st];
              return (
                <li key={s.id} className="flex items-center gap-2 rounded-md border border-scada-line bg-zinc-950/40 px-2 py-1.5">
                  <Icon className={`h-4 w-4 shrink-0 ${cls}`} aria-label={label} />
                  <span className="w-5 shrink-0 font-mono text-[11px] text-zinc-500">{i + 1}</span>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: phaseById(s.phase).color }} />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{s.name}</span>
                  <span className={`text-[10px] font-semibold uppercase ${st === 'passed' ? 'text-emerald-400' : st === 'failed' ? 'text-red-400' : st === 'blocked' ? 'text-amber-400' : 'text-zinc-500'}`}>{label}</span>
                  <button className="btn btn-sm px-1.5" aria-label={`Run ${s.name}`} disabled={running} onClick={() => runSingle(s)}><Play className="h-3.5 w-3.5" /></button>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ---- scenarios + interlocks ---- */}
        <section className="panel min-w-0 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="panel-title">Scenarios &amp; interlock logic</h3>
            <div className="flex flex-wrap gap-1.5">
              <button className="btn btn-sm" onClick={scenarioNormal}><RefreshCw className="h-3.5 w-3.5" /> Normal</button>
              <button className="btn btn-sm btn-danger" onClick={scenarioExcursion}><Zap className="h-3.5 w-3.5" /> Excursion</button>
              <button className={`btn btn-sm ${commsLost ? 'border-red-500/60 text-red-300' : ''}`} onClick={toggleComms}><WifiOff className="h-3.5 w-3.5" /> {commsLost ? 'Restore comms' : 'Comms loss'}</button>
              <label className="btn btn-sm cursor-pointer">
                <input type="checkbox" className="accent-cyan-400" checked={drift} onChange={(e) => setDrift(e.target.checked)} /> Live drift
              </label>
            </div>
          </div>

          {latched.length > 0 && (
            <div className="mb-2 flex items-center justify-between rounded-md border border-red-500/50 bg-red-500/10 p-2 text-xs text-red-200">
              <span className="flex items-center gap-1.5"><ShieldAlert className="h-4 w-4" /> {latched.length} latched trip / ESD - step execution is blocked.</span>
              <button className="btn btn-sm" onClick={resetLatched}>Reset</button>
            </div>
          )}

          {interlocks.length === 0 ? (
            <p className="p-3 text-xs text-zinc-500">No interlocks defined. Add them in Configure → Safety Interlocks.</p>
          ) : (
            <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
              {interlocks.map((i) => {
                const on = active.some((a) => a.id === i.id);
                const mapped = io.some((p) => p.tag === i.tag);
                return (
                  <li key={i.id} className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${on ? ACTION_CLS[i.action] : 'border-scada-line bg-zinc-950/40 text-zinc-300'}`}>
                    {on ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0 text-zinc-600" />}
                    <span className="font-mono font-semibold">{i.tag}</span>
                    <span>{i.op} {i.value}</span>
                    <span className={`chip ${ACTION_CLS[i.action]}`}>{i.action}</span>
                    <span className="min-w-0 flex-1 truncate text-zinc-400" title={i.description}>{i.description}</span>
                    {!mapped && <span className="chip border-red-500/50 text-red-300">unmapped</span>}
                    <button className="btn btn-sm px-2" disabled={!mapped} onClick={() => forceInterlock(i)}>Trigger</button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        {/* ---- live tags ---- */}
        <section className="panel min-w-0 p-3">
          <h3 className="panel-title mb-2">Live field tags (simulated)</h3>
          {io.length === 0 ? (
            <p className="p-3 text-xs text-zinc-500">No I/O points yet. Define them in Configure → I/O Point Mapping.</p>
          ) : (
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-scada-panel text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr><th className="p-1.5 text-left">Tag</th><th className="p-1.5 text-left">Value</th><th className="p-1.5 text-left">State</th></tr>
                </thead>
                <tbody>
                  {io.map((p) => {
                    const v = tags[p.tag];
                    const hits = active.filter((a) => a.tag === p.tag);
                    const worst = hits.find((h) => h.action === 'ESD') || hits.find((h) => h.action === 'TRIP') || hits[0];
                    const analog = p.type === 'AI' || p.type === 'AO';
                    return (
                      <tr key={p.tag} className="border-t border-scada-line align-middle">
                        <td className="p-1.5">
                          <div className="font-mono font-semibold text-cyan-300">{p.tag}</div>
                          <div className="max-w-[160px] truncate text-[10px] text-zinc-500">{p.description}</div>
                        </td>
                        <td className="p-1.5">
                          {analog ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                aria-label={`${p.tag} value`}
                                className="w-24 accent-amber-400 sm:w-36"
                                min={num(p.min)}
                                max={num(p.max)}
                                step={(num(p.max) - num(p.min)) / 200 || 1}
                                value={v ?? 0}
                                onChange={(e) => setTag(p.tag, +e.target.value)}
                              />
                              <span className={`w-24 font-mono text-xs ${commsLost ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                                {commsLost ? 'BAD' : `${Number(v).toFixed(2)} ${p.units}`}
                              </span>
                            </div>
                          ) : (
                            <button
                              className={`btn btn-sm min-w-[64px] ${num(v) === 1 ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : ''}`}
                              onClick={() => setTag(p.tag, num(v) === 1 ? 0 : 1)}
                            >
                              {num(v) === 1 ? 'ON / 1' : 'OFF / 0'}
                            </button>
                          )}
                        </td>
                        <td className="p-1.5">
                          {commsLost ? (
                            <span className="chip border-red-500/50 text-red-300">BAD</span>
                          ) : worst ? (
                            <span className={`chip ${ACTION_CLS[worst.action]}`}>{worst.action}</span>
                          ) : (
                            <span className="chip border-emerald-500/30 text-emerald-300">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---- trend + log ---- */}
        <section className="min-w-0 space-y-4">
          <div className="panel p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="panel-title">Trend (60 s)</h3>
              <select className="input w-auto py-1 text-xs" value={trendTag} onChange={(e) => setTrendTag(e.target.value)} aria-label="Trend tag">
                {io.map((p) => <option key={p.tag}>{p.tag}</option>)}
              </select>
            </div>
            <Sparkline data={trend} point={io.find((p) => p.tag === trendTag)} thresholds={interlocks.filter((i) => i.tag === trendTag)} />
          </div>

          <div className="panel flex h-64 flex-col p-3">
            <div className="mb-1 flex items-center justify-between">
              <h3 className="panel-title">Event log</h3>
              <button className="text-[11px] text-zinc-500 hover:text-zinc-300" onClick={() => setLog([])}>clear</button>
            </div>
            <div className="hmi-grid flex-1 overflow-y-auto rounded border border-scada-line bg-black/50 p-2 font-mono text-[11px] leading-relaxed">
              {log.length === 0 && <span className="text-zinc-600">No events. Run the workflow or change a tag value.</span>}
              {log.map((l, i) => (
                <div key={i} className={{ ok: 'text-emerald-300', warn: 'text-amber-300', error: 'text-red-300', info: 'text-zinc-300' }[l.level]}>
                  <span className="text-zinc-600">{l.t}</span> {l.msg}
                </div>
              ))}
              <div ref={logEnd} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Sparkline({ data, point, thresholds }) {
  const W = 320;
  const H = 110;
  if (!point || data.length < 2) {
    return <div className="flex h-[110px] items-center justify-center text-xs text-zinc-600">Collecting samples…</div>;
  }
  const min = Number(point.min);
  const max = Number(point.max);
  const span = max - min || 1;
  const x = (i) => (i / 59) * W;
  const y = (v) => H - 6 - ((v - min) / span) * (H - 12);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i + (60 - data.length)).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[110px] w-full rounded bg-black/40" role="img" aria-label={`Trend of ${point.tag}`}>
      {thresholds.map((t) =>
        t.op === '==' ? null : (
          <g key={t.id}>
            <line x1="0" x2={W} y1={y(Number(t.value))} y2={y(Number(t.value))} stroke={t.action === 'ALARM' ? '#f5a524' : '#f87171'} strokeDasharray="4 3" strokeWidth="1" />
            <text x="4" y={y(Number(t.value)) - 2} fontSize="8" fill={t.action === 'ALARM' ? '#f5a524' : '#f87171'}>{t.action} {t.op}{t.value}</text>
          </g>
        )
      )}
      <path d={path} fill="none" stroke="#22d3ee" strokeWidth="1.8" />
      <text x={W - 4} y="10" fontSize="9" textAnchor="end" fill="#a1a1aa">{Number(data[data.length - 1]).toFixed(2)} {point.units}</text>
    </svg>
  );
}
