import { COMPANY, PHASES, VENDORS, phaseById, sectorById } from '../data/agacStandards';
import { allInterlocks, allIoPoints, loopCheckPoints } from './validation';

/* ---------------- helpers ---------------- */

export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function downloadFile(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const safeName = (s) => String(s || 'document').replace(/[^a-z0-9\-_]+/gi, '_').replace(/^_+|_+$/g, '') || 'document';

/** Print via a hidden iframe (more reliable than popups, works on tablets: "Save as PDF"). */
export function exportToPdf(html, title = 'ScadaSteps') {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.title = title;
  doc.close();
  const go = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => iframe.remove(), 4000);
    }
  };
  if (doc.readyState === 'complete') setTimeout(go, 250);
  else iframe.onload = () => setTimeout(go, 250);
}

/* ---------------- document model ---------------- */

const today = () => new Date().toISOString().slice(0, 10);

export const DOC_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color:#111827; margin:0; padding:24px; font-size:12px; line-height:1.5; }
  .agac-head { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #f5a524; padding-bottom:10px; margin-bottom:14px; }
  .agac-head .brand { font-size:20px; font-weight:800; letter-spacing:.04em; }
  .agac-head .brand span { color:#f5a524; }
  .agac-head .addr { font-size:10px; color:#4b5563; text-align:right; }
  h1 { font-size:18px; margin:6px 0 2px; }
  h2 { font-size:14px; margin:22px 0 6px; padding:4px 8px; background:#111827; color:#fff; border-left:5px solid #f5a524; }
  h3 { font-size:12.5px; margin:14px 0 4px; border-bottom:1px solid #d1d5db; padding-bottom:2px; }
  table { width:100%; border-collapse:collapse; margin:6px 0 10px; }
  th, td { border:1px solid #9ca3af; padding:4px 6px; text-align:left; vertical-align:top; }
  th { background:#e5e7eb; font-size:11px; }
  .meta td:first-child { width:22%; background:#f3f4f6; font-weight:600; }
  .step { page-break-inside:avoid; border:1px solid #9ca3af; margin:8px 0; }
  .step .st { background:#f3f4f6; padding:5px 8px; font-weight:700; display:flex; justify-content:space-between; gap:8px; }
  .step .sb { padding:6px 8px; }
  .tag { display:inline-block; font-size:10px; padding:1px 6px; border-radius:9px; background:#fde68a; margin-left:4px; }
  .chk { list-style:none; padding:0; margin:4px 0; }
  .chk li:before { content:'\\2610  '; }
  .chk li.done:before { content:'\\2611  '; }
  .small { font-size:10.5px; color:#4b5563; }
  .sign td { height:34px; }
  .parallel { color:#92400e; font-weight:600; font-size:10.5px; }
  @media print { body { padding:0; } h2 { -webkit-print-color-adjust:exact; print-color-adjust:exact; } th, .step .st, .meta td:first-child { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`;

function stepNumbering(steps) {
  // Parallel steps get letters (3a, 3b) to show the branch.
  const out = [];
  let n = 0;
  let sub = 0;
  steps.forEach((s, i) => {
    if (s.parallel && i > 0) {
      sub += 1;
      if (sub === 1) out[i - 1] = `${n}a`;
      out.push(`${n}${String.fromCharCode(97 + sub)}`);
    } else {
      n += 1;
      sub = 0;
      out.push(String(n));
    }
  });
  return out;
}

/**
 * Builds the complete AGAC-branded Method Statement / Commissioning Procedure as HTML.
 * `project` = {name, client, site, docNo, revision, author, reviewer, approver}
 */
export function buildMethodStatement(project, steps, sectorId, opts = {}) {
  const sector = sectorById(sectorId);
  const nums = stepNumbering(steps);
  const io = allIoPoints(steps);
  const ils = allInterlocks(steps);
  const stdSet = [...new Set(steps.flatMap((s) => s.standards || []))].sort();
  const vendors = (sector?.vendors || []).map((id) => VENDORS.find((v) => v.id === id)).filter(Boolean);
  const date = opts.date || today();
  const title = `${sector ? sector.name : 'Industrial Automation'} - Commissioning Procedure & Method Statement`;

  const meta = (k, v) => `<tr><td>${esc(k)}</td><td>${esc(v) || '&nbsp;'}</td></tr>`;

  const header = `
    <div class="agac-head">
      <div class="brand">AGAC <span>|</span> Al Gurg Automation</div>
      <div class="addr">${esc(COMPANY.address)}<br/>${esc(COMPANY.web)}</div>
    </div>
    <h1>${esc(title)}</h1>
    <div class="small">Generated by ScadaSteps on ${esc(date)}</div>
    <table class="meta">
      ${meta('Project', project.name)}
      ${meta('Client', project.client)}
      ${meta('Site / Location', project.site)}
      ${meta('Sector', sector?.name)}
      ${meta('Document No.', project.docNo)}
      ${meta('Revision', project.revision)}
    </table>`;

  const revisions = `
    <h2>1. Document Control & Revision History</h2>
    <table>
      <tr><th>Rev</th><th>Date</th><th>Description</th><th>Prepared</th><th>Reviewed</th><th>Approved</th></tr>
      <tr><td>${esc(project.revision || 'A')}</td><td>${esc(date)}</td><td>Issued for review</td><td>${esc(project.author)}</td><td>${esc(project.reviewer)}</td><td>${esc(project.approver)}</td></tr>
      <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
    </table>`;

  const purpose = `
    <h2>2. Purpose & Scope</h2>
    <p>This procedure defines the sequence of engineering, test and commissioning activities for the <b>${esc(project.name || 'project')}</b> control and SCADA system${project.client ? ` for <b>${esc(project.client)}</b>` : ''}. It covers ${steps.length} activities across ${new Set(steps.map((s) => s.phase)).size} project phases, from planning through to handover.</p>
    ${vendors.length ? `<p class="small"><b>Reference automation platforms:</b> ${vendors.map((v) => `${esc(v.name)} (${esc(v.platforms)})`).join('; ')}.</p>` : ''}`;

  const refs = `
    <h2>3. Reference Standards</h2>
    ${stdSet.length ? `<ul>${stdSet.map((s) => `<li><b>${esc(s)}</b></li>`).join('')}</ul>` : '<p>None selected.</p>'}
    <p class="small">Project specifications, client standards and applicable UAE authority requirements take precedence where more stringent.</p>`;

  const resp = `
    <h2>4. Roles & Responsibilities</h2>
    <table>
      <tr><th>Role</th><th>Responsibility</th><th>Name</th></tr>
      <tr><td>Project Engineer</td><td>Overall coordination, document control and schedule</td><td>${esc(project.author)}</td></tr>
      <tr><td>SCADA / Controls Engineer</td><td>Execute test steps, record results, raise punch items</td><td></td></tr>
      <tr><td>Reviewer / QA</td><td>Verify procedure compliance and records</td><td>${esc(project.reviewer)}</td></tr>
      <tr><td>Client Representative</td><td>Witness tests and sign acceptance</td><td>${esc(project.client)}</td></tr>
      <tr><td>HSE Officer</td><td>Permit to work, isolation and site safety</td><td></td></tr>
    </table>`;

  const safety = `
    <h2>5. Health, Safety & Prerequisites</h2>
    <ul>
      <li>Valid Permit-to-Work, isolation certificates and toolbox talk before any field activity.</li>
      <li>Lock-out / tag-out applied; hazardous-area rules observed (IEC 60079) and approved test equipment used.</li>
      <li>Calibrated instruments with valid certificates; software backups taken before any logic change.</li>
      <li>Communicate with the control room before forcing signals or bypassing interlocks; every bypass must be logged and removed after test.</li>
    </ul>`;

  // Procedure
  let lastPhase = null;
  let proc = '<h2>6. Procedure</h2>';
  steps.forEach((s, i) => {
    if (s.phase !== lastPhase) {
      lastPhase = s.phase;
      proc += `<h3>${esc(phaseById(s.phase).label)}</h3>`;
    }
    const c = s.config || {};
    const checklist = (c.checklist || []).length
      ? `<ul class="chk">${c.checklist.map((x) => `<li class="${x.done ? 'done' : ''}">${esc(x.text)}</li>`).join('')}</ul>`
      : '';
    const net = c.network && (c.network.protocol || c.network.topology)
      ? `<p><b>Network:</b> ${esc([c.network.protocol, c.network.topology, c.network.redundancy, c.network.ipRange].filter(Boolean).join(' / '))}${c.network.notes ? ` - ${esc(c.network.notes)}` : ''}</p>`
      : '';
    const tagConv = c.tagConvention ? `<p><b>Tag naming:</b> ${esc(c.tagConvention)}</p>` : '';
    const so = c.signoff || {};
    proc += `
      <div class="step">
        <div class="st"><span>${esc(nums[i])}. ${esc(s.name)} ${s.parallel ? '<span class="parallel">(parallel activity)</span>' : ''}</span>
          <span>${(s.standards || []).map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</span></div>
        <div class="sb">
          <p>${esc(s.description)}</p>
          ${tagConv}${net}
          ${checklist}
          ${c.notes ? `<p class="small"><b>Notes:</b> ${esc(c.notes)}</p>` : ''}
          <p class="small">Sign-off: Engineer <b>${esc(so.engineer) || '________'}</b> &nbsp; Client witness <b>${esc(so.client) || '________'}</b> &nbsp; Date <b>${esc(so.date) || '________'}</b> &nbsp; Status <b>${esc((so.status || 'pending').toUpperCase())}</b></p>
        </div>
      </div>`;
  });

  // Appendices
  const ioTable = io.length
    ? `<table><tr><th>Tag</th><th>Description</th><th>Type</th><th>Range</th><th>Units</th><th>Address</th></tr>
        ${io.map((p) => `<tr><td>${esc(p.tag)}</td><td>${esc(p.description)}</td><td>${esc(p.type)}</td><td>${esc(p.min)} - ${esc(p.max)}</td><td>${esc(p.units)}</td><td>${esc(p.address)}</td></tr>`).join('')}</table>`
    : '<p>No I/O points defined.</p>';

  const ilTable = ils.length
    ? `<table><tr><th>#</th><th>Tag</th><th>Condition</th><th>Action</th><th>Description</th><th>Tested (Y/N)</th></tr>
        ${ils.map((i, n) => `<tr><td>${n + 1}</td><td>${esc(i.tag)}</td><td>${esc(i.op)} ${esc(i.value)}</td><td><b>${esc(i.action)}</b></td><td>${esc(i.description)}</td><td></td></tr>`).join('')}</table>`
    : '<p>No interlocks defined.</p>';

  const loopStep = steps.find((s) => s.key === 'loop_check');
  const tol = loopStep?.config?.loopCheck?.tolerance ?? '0.5';
  const tp = loopStep?.config?.loopCheck?.testPoints ?? '0,25,50,75,100';
  const analog = io.filter((p) => p.type === 'AI' || p.type === 'AO');
  const loopRows = analog
    .map((p) => {
      const pts = loopCheckPoints(p, tp);
      return pts
        .map(
          (r, i) =>
            `<tr>${i === 0 ? `<td rowspan="${pts.length}">${esc(p.tag)}</td>` : ''}<td>${r.pct}%</td><td>${esc(r.mA)} mA</td><td>${esc(r.value)} ${esc(p.units)}</td><td></td><td></td></tr>`
        )
        .join('');
    })
    .join('');
  const loopTable = analog.length
    ? `<p class="small">Acceptance tolerance: ±${esc(tol)} % of span.</p>
       <table><tr><th>Tag</th><th>Test point</th><th>Signal</th><th>Expected HMI value</th><th>Measured</th><th>Pass / Fail</th></tr>${loopRows}</table>`
    : '<p>No analog signals defined.</p>';

  const appendix = `
    <h2>7. Appendix A - I/O Schedule</h2>${ioTable}
    <h2>8. Appendix B - Interlock & Trip Register</h2>${ilTable}
    <h2>9. Appendix C - Loop Check Record Sheet</h2>${loopTable}
    <h2>10. Acceptance & Sign-off</h2>
    <table class="sign">
      <tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr>
      <tr><td>Prepared (AGAC)</td><td>${esc(project.author)}</td><td></td><td></td></tr>
      <tr><td>Reviewed (AGAC)</td><td>${esc(project.reviewer)}</td><td></td><td></td></tr>
      <tr><td>Approved (AGAC)</td><td>${esc(project.approver)}</td><td></td><td></td></tr>
      <tr><td>Accepted (Client)</td><td>${esc(project.client)}</td><td></td><td></td></tr>
    </table>`;

  const body = header + revisions + purpose + refs + resp + safety + proc + appendix;
  return {
    title,
    body,
    html: `<!doctype html><html><head><meta charset="utf-8"/><title>${esc(title)}</title><style>${DOC_CSS}</style></head><body>${body}</body></html>`,
  };
}

/** Plain markdown version of the procedure (for download / copy). */
export function buildMarkdown(project, steps, sectorId) {
  const sector = sectorById(sectorId);
  const nums = stepNumbering(steps);
  const lines = [];
  lines.push(`# ${sector ? sector.name : 'Industrial Automation'} - Commissioning Procedure`);
  lines.push('');
  lines.push(`**${COMPANY.name}** - ${COMPANY.address} - ${COMPANY.web}`);
  lines.push('');
  lines.push(`| | |`, `|---|---|`);
  [['Project', project.name], ['Client', project.client], ['Site', project.site], ['Document No.', project.docNo], ['Revision', project.revision], ['Prepared', project.author], ['Reviewed', project.reviewer], ['Approved', project.approver]].forEach(([k, v]) => lines.push(`| ${k} | ${v || ''} |`));
  lines.push('');
  let last = null;
  steps.forEach((s, i) => {
    if (s.phase !== last) {
      last = s.phase;
      lines.push(`## ${PHASES.find((p) => p.id === s.phase)?.label || s.phase}`, '');
    }
    lines.push(`### ${nums[i]}. ${s.name}${s.parallel ? ' _(parallel)_' : ''}`);
    if ((s.standards || []).length) lines.push(`_Standards: ${s.standards.join(', ')}_`);
    lines.push('', s.description, '');
    (s.config?.checklist || []).forEach((c) => lines.push(`- [${c.done ? 'x' : ' '}] ${c.text}`));
    lines.push('');
  });
  const io = allIoPoints(steps);
  if (io.length) {
    lines.push('## Appendix A - I/O Schedule', '', '| Tag | Description | Type | Range | Units | Address |', '|---|---|---|---|---|---|');
    io.forEach((p) => lines.push(`| ${p.tag} | ${p.description} | ${p.type} | ${p.min}-${p.max} | ${p.units} | ${p.address} |`));
    lines.push('');
  }
  const ils = allInterlocks(steps);
  if (ils.length) {
    lines.push('## Appendix B - Interlocks', '', '| Tag | Condition | Action | Description |', '|---|---|---|---|');
    ils.forEach((i) => lines.push(`| ${i.tag} | ${i.op} ${i.value} | ${i.action} | ${i.description} |`));
    lines.push('');
  }
  return lines.join('\n');
}
