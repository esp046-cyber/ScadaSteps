import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ListChecks, Network, Plus, ShieldAlert, Tag, Trash2, Gauge, PenLine, Info } from 'lucide-react';
import { NETWORK_PROTOCOLS, NETWORK_TOPOLOGIES, PHASES, phaseById, DEFAULT_TAG_CONVENTION } from '../data/agacStandards';
import { isValidTag, loopCheckPoints, newId } from '../utils/validation';

/* ---------- small building blocks ---------- */
function Section({ icon: Icon, title, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel overflow-hidden">
      <button className="flex w-full items-center gap-2 px-3 py-3 text-left hover:bg-zinc-800/40" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
        <Icon className="h-4 w-4 text-amber-300" />
        <span className="flex-1 text-sm font-semibold text-zinc-100">{title}</span>
        {badge != null && <span className="chip border-zinc-700 bg-zinc-900 text-zinc-300">{badge}</span>}
      </button>
      {open && <div className="border-t border-scada-line p-3">{children}</div>}
    </div>
  );
}

const Field = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="label">{label}</label>
    {children}
  </div>
);

const PROTOCOL_HINTS = {
  Profinet: 'Use MRP for ring redundancy; assign device names via TIA/commissioning tool; verify cycle times (RT / IRT).',
  'Modbus TCP': 'Port 502. Document register map, byte/word order and polling rate. Verify unit IDs behind gateways.',
  'Modbus RTU': 'Confirm baud rate, parity, stop bits, termination and slave IDs. Max 247 devices per segment.',
  'IEC 61850 (MMS / GOOSE)': 'Verify SCD/ICD/CID consistency, GOOSE VLAN priority tagging, time sync (SNTP/PTP) and PRP/HSR where required.',
  'IEC 60870-5-104': 'Port 2404. Verify ASDU addresses, information object addresses, general interrogation and time sync.',
  DNP3: 'Port 20000. Confirm outstation addresses, class 0/1/2/3 event mapping and unsolicited reporting.',
  'OPC UA': 'Check certificates, security policy and endpoint URLs; align with IEC 62443 zone boundaries.',
  'EtherNet/IP': 'Verify RPI values, multicast filtering (IGMP snooping) and DLR ring behaviour.',
  HART: 'Verify device descriptors (DD) and multiplexer addressing; record loop current and damping.',
  'Profibus DP': 'Check termination, baud rate vs. segment length and station addresses.',
  'Foundation Fieldbus': 'Verify segment power, macrocycle scheduling and link active scheduler (LAS) redundancy.',
  'BACnet/IP': 'Check BBMD configuration, device instance numbers and object mapping.',
};

export default function StepConfigurator({ steps, setSteps, selectedId, onSelect }) {
  const step = steps.find((s) => s.id === selectedId) || null;

  const update = (patch) => setSteps((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  const updateConfig = (patch) => setSteps((prev) => prev.map((s) => (s.id === selectedId ? { ...s, config: { ...s.config, ...patch } } : s)));

  const lc = step?.config.loopCheck || { tolerance: '0.5', testPoints: '0,25,50,75,100' };

  // IO points editable here are scoped to the selected step; loop check preview aggregates all analog points in workflow
  const allAnalog = useMemo(() => {
    const seen = new Map();
    steps.forEach((s) => (s.config?.ioPoints || []).forEach((p) => (p.type === 'AI' || p.type === 'AO') && p.tag && !seen.has(p.tag) && seen.set(p.tag, p)));
    return [...seen.values()];
  }, [steps]);

  if (steps.length === 0) {
    return <div className="panel p-8 text-center text-sm text-zinc-400">Add steps in the Builder first, then configure them here.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      {/* step picker */}
      <aside className="panel max-h-[40vh] overflow-y-auto p-2 lg:sticky lg:top-20 lg:max-h-[calc(100vh-7rem)]">
        <h3 className="panel-title px-2 py-1.5">Steps</h3>
        <ul className="space-y-0.5">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s.id)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition ${
                  s.id === selectedId ? 'bg-amber-400/10 text-amber-200' : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: phaseById(s.phase).color }} />
                <span className="w-5 shrink-0 font-mono text-[11px] text-zinc-500">{i + 1}</span>
                <span className="flex-1 truncate">{s.name}</span>
                {s.config?.signoff?.status === 'approved' && <span className="text-emerald-400">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* editor */}
      {!step ? (
        <div className="panel flex items-center justify-center p-8 text-sm text-zinc-400">Select a step to configure.</div>
      ) : (
        <div className="min-w-0 space-y-3">
          <div className="panel p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Step name" className="sm:col-span-2">
                <input className="input" value={step.name} onChange={(e) => update({ name: e.target.value })} />
              </Field>
              <Field label="Phase">
                <select className="input" value={step.phase} onChange={(e) => update({ phase: e.target.value })}>
                  {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Standards (comma separated)">
                <input
                  className="input"
                  value={(step.standards || []).join(', ')}
                  onChange={(e) => update({ standards: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
                />
              </Field>
              <Field label="Description / scope" className="sm:col-span-2">
                <textarea className="input min-h-[80px]" value={step.description} onChange={(e) => update({ description: e.target.value })} />
              </Field>
              <Field label="Engineer notes" className="sm:col-span-2">
                <textarea className="input min-h-[60px]" value={step.config.notes} onChange={(e) => updateConfig({ notes: e.target.value })} placeholder="Site-specific notes, hold points, client comments…" />
              </Field>
            </div>
          </div>

          {/* ---------------- IO & Tags ---------------- */}
          <Section icon={Tag} title="I/O Point Mapping & Tag Naming" badge={step.config.ioPoints.length} defaultOpen={step.key === 'io_list' || step.key === 'tag_naming'}>
            <Field label="Tag naming convention" className="mb-3">
              <input className="input" value={step.config.tagConvention} onChange={(e) => updateConfig({ tagConvention: e.target.value })} placeholder={DEFAULT_TAG_CONVENTION} />
            </Field>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-zinc-400">ISA-5.1 pattern check: <code className="text-cyan-300">TT-101</code>, <code className="text-cyan-300">PSV-2001A</code></span>
              <button
                className="btn btn-sm"
                onClick={() => updateConfig({ ioPoints: [...step.config.ioPoints, { id: newId(), tag: '', description: '', type: 'AI', min: 0, max: 100, units: '', address: '' }] })}
              >
                <Plus className="h-4 w-4" /> Add point
              </button>
            </div>
            <div className="space-y-2">
              {step.config.ioPoints.map((p, idx) => {
                const set = (patch) => updateConfig({ ioPoints: step.config.ioPoints.map((x) => (x.id === p.id ? { ...x, ...patch } : x)) });
                const bad = p.tag && !isValidTag(p.tag);
                return (
                  <div key={p.id} className="grid grid-cols-2 gap-2 rounded-md border border-scada-line bg-zinc-950/40 p-2 sm:grid-cols-12">
                    <input aria-label="Tag" className={`input col-span-1 sm:col-span-2 font-mono uppercase ${bad ? 'border-amber-500/70' : ''}`} placeholder="TT-101" value={p.tag} onChange={(e) => set({ tag: e.target.value.toUpperCase() })} />
                    <input aria-label="Description" className="input col-span-1 sm:col-span-3" placeholder="Description" value={p.description} onChange={(e) => set({ description: e.target.value })} />
                    <select aria-label="Type" className="input col-span-1 sm:col-span-1" value={p.type} onChange={(e) => set({ type: e.target.value })}>
                      {['AI', 'AO', 'DI', 'DO'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input aria-label="Min" type="number" className="input col-span-1 sm:col-span-1" placeholder="Min" value={p.min} onChange={(e) => set({ min: e.target.value })} />
                    <input aria-label="Max" type="number" className="input col-span-1 sm:col-span-1" placeholder="Max" value={p.max} onChange={(e) => set({ max: e.target.value })} />
                    <input aria-label="Units" className="input col-span-1 sm:col-span-1" placeholder="Unit" value={p.units} onChange={(e) => set({ units: e.target.value })} />
                    <input aria-label="Address" className="input col-span-1 sm:col-span-2 font-mono" placeholder="IW64" value={p.address} onChange={(e) => set({ address: e.target.value })} />
                    <button className="btn btn-danger btn-sm col-span-2 sm:col-span-1" aria-label="Remove point" onClick={() => updateConfig({ ioPoints: step.config.ioPoints.filter((x) => x.id !== p.id) })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {bad && <p className="col-span-2 text-[11px] text-amber-300 sm:col-span-12">Tag #{idx + 1} does not match the ISA-5.1 pattern.</p>}
                  </div>
                );
              })}
              {step.config.ioPoints.length === 0 && <p className="text-xs text-zinc-500">No I/O points on this step. Points added on any step are available in loop checks and the simulator.</p>}
            </div>
          </Section>

          {/* ---------------- Interlocks ---------------- */}
          <Section icon={ShieldAlert} title="Safety Interlocks & Trips" badge={step.config.interlocks.length} defaultOpen={step.key === 'interlock_logic' || step.key === 'esd_verification'}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-zinc-400">Used by the Gap Audit and Simulator to verify trip logic.</span>
              <button
                className="btn btn-sm"
                onClick={() => updateConfig({ interlocks: [...step.config.interlocks, { id: newId(), tag: '', op: '>', value: 0, action: 'ALARM', description: '' }] })}
              >
                <Plus className="h-4 w-4" /> Add interlock
              </button>
            </div>
            <div className="space-y-2">
              {step.config.interlocks.map((i) => {
                const set = (patch) => updateConfig({ interlocks: step.config.interlocks.map((x) => (x.id === i.id ? { ...x, ...patch } : x)) });
                return (
                  <div key={i.id} className="grid grid-cols-2 gap-2 rounded-md border border-scada-line bg-zinc-950/40 p-2 sm:grid-cols-12">
                    <input aria-label="Tag" className="input col-span-1 sm:col-span-2 font-mono uppercase" placeholder="Tag" value={i.tag} onChange={(e) => set({ tag: e.target.value.toUpperCase() })} />
                    <select aria-label="Operator" className="input col-span-1 sm:col-span-1" value={i.op} onChange={(e) => set({ op: e.target.value })}>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value="==">=</option>
                    </select>
                    <input aria-label="Set-point" type="number" className="input col-span-1 sm:col-span-2" value={i.value} onChange={(e) => set({ value: e.target.value })} />
                    <select aria-label="Action" className="input col-span-1 sm:col-span-2" value={i.action} onChange={(e) => set({ action: e.target.value })}>
                      <option>ALARM</option>
                      <option>TRIP</option>
                      <option>ESD</option>
                    </select>
                    <input aria-label="Description" className="input col-span-2 sm:col-span-4" placeholder="Cause / consequence" value={i.description} onChange={(e) => set({ description: e.target.value })} />
                    <button className="btn btn-danger btn-sm col-span-2 sm:col-span-1" aria-label="Remove interlock" onClick={() => updateConfig({ interlocks: step.config.interlocks.filter((x) => x.id !== i.id) })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
              {step.config.interlocks.length === 0 && <p className="text-xs text-zinc-500">No interlocks on this step.</p>}
            </div>
          </Section>

          {/* ---------------- Loop check & calibration ---------------- */}
          <Section icon={Gauge} title="Loop Check & Instrument Calibration" badge={step.config.calibration.length} defaultOpen={step.key === 'loop_check' || step.key === 'instrument_calibration'}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Loop check tolerance (± % of span)">
                <input type="number" step="0.1" className="input" value={lc.tolerance} onChange={(e) => updateConfig({ loopCheck: { ...lc, tolerance: e.target.value } })} />
              </Field>
              <Field label="Test points (% of span)">
                <input className="input font-mono" value={lc.testPoints} onChange={(e) => updateConfig({ loopCheck: { ...lc, testPoints: e.target.value } })} />
              </Field>
            </div>

            {allAnalog.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-md border border-scada-line">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr><th className="p-2 text-left">Tag</th><th className="p-2 text-left">Expected (signal → HMI value)</th></tr>
                  </thead>
                  <tbody>
                    {allAnalog.map((p) => (
                      <tr key={p.tag} className="border-t border-scada-line">
                        <td className="p-2 font-mono text-cyan-300">{p.tag}</td>
                        <td className="p-2 text-zinc-300">
                          {loopCheckPoints(p, lc.testPoints).map((r) => `${r.pct}%: ${r.mA}mA → ${r.value}${p.units ? ' ' + p.units : ''}`).join('  |  ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mb-2 mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Calibration record</span>
              <button className="btn btn-sm" onClick={() => updateConfig({ calibration: [...step.config.calibration, { id: newId(), tag: '', range: '', asFound: '', asLeft: '', pass: false }] })}>
                <Plus className="h-4 w-4" /> Add instrument
              </button>
            </div>
            <div className="space-y-2">
              {step.config.calibration.map((c) => {
                const set = (patch) => updateConfig({ calibration: step.config.calibration.map((x) => (x.id === c.id ? { ...x, ...patch } : x)) });
                return (
                  <div key={c.id} className="grid grid-cols-2 gap-2 rounded-md border border-scada-line bg-zinc-950/40 p-2 sm:grid-cols-12">
                    <input aria-label="Tag" className="input sm:col-span-2 font-mono uppercase" placeholder="Tag" value={c.tag} onChange={(e) => set({ tag: e.target.value.toUpperCase() })} />
                    <input aria-label="Range" className="input sm:col-span-3" placeholder="Range" value={c.range} onChange={(e) => set({ range: e.target.value })} />
                    <input aria-label="As found" className="input sm:col-span-2" placeholder="As found" value={c.asFound} onChange={(e) => set({ asFound: e.target.value })} />
                    <input aria-label="As left" className="input sm:col-span-2" placeholder="As left" value={c.asLeft} onChange={(e) => set({ asLeft: e.target.value })} />
                    <label className="col-span-1 flex items-center gap-2 text-xs text-zinc-300 sm:col-span-2">
                      <input type="checkbox" checked={c.pass} onChange={(e) => set({ pass: e.target.checked })} /> Pass
                    </label>
                    <button className="btn btn-danger btn-sm col-span-1 sm:col-span-1" aria-label="Remove" onClick={() => updateConfig({ calibration: step.config.calibration.filter((x) => x.id !== c.id) })}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ---------------- Network ---------------- */}
          <Section icon={Network} title="Network Architecture" badge={step.config.network.protocol || '-'} defaultOpen={step.key === 'network_arch' || step.key === 'iec61850_comm_test'}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Protocol">
                <select className="input" value={step.config.network.protocol} onChange={(e) => updateConfig({ network: { ...step.config.network, protocol: e.target.value } })}>
                  <option value="">- select -</option>
                  {NETWORK_PROTOCOLS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Topology">
                <select className="input" value={step.config.network.topology} onChange={(e) => updateConfig({ network: { ...step.config.network, topology: e.target.value } })}>
                  <option value="">- select -</option>
                  {NETWORK_TOPOLOGIES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Redundancy method">
                <input className="input" value={step.config.network.redundancy || ''} onChange={(e) => updateConfig({ network: { ...step.config.network, redundancy: e.target.value } })} placeholder="MRP / RSTP / PRP / HSR…" />
              </Field>
              <Field label="IP range / VLAN plan">
                <input className="input font-mono" value={step.config.network.ipRange || ''} onChange={(e) => updateConfig({ network: { ...step.config.network, ipRange: e.target.value } })} placeholder="10.10.1.0/24, VLAN 10" />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <textarea className="input" value={step.config.network.notes || ''} onChange={(e) => updateConfig({ network: { ...step.config.network, notes: e.target.value } })} />
              </Field>
            </div>
            {PROTOCOL_HINTS[step.config.network.protocol] && (
              <p className="mt-3 flex gap-2 rounded-md border border-cyan-500/30 bg-cyan-500/5 p-2 text-xs text-cyan-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                {PROTOCOL_HINTS[step.config.network.protocol]}
              </p>
            )}
          </Section>

          {/* ---------------- Checklist ---------------- */}
          <Section icon={ListChecks} title="Checklist" badge={`${step.config.checklist.filter((c) => c.done).length}/${step.config.checklist.length}`} defaultOpen>
            <ul className="space-y-1.5">
              {step.config.checklist.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-amber-400"
                    checked={c.done}
                    onChange={(e) => updateConfig({ checklist: step.config.checklist.map((x) => (x.id === c.id ? { ...x, done: e.target.checked } : x)) })}
                  />
                  <input
                    className={`input ${c.done ? 'text-zinc-500 line-through' : ''}`}
                    value={c.text}
                    onChange={(e) => updateConfig({ checklist: step.config.checklist.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })}
                  />
                  <button className="btn btn-danger btn-sm px-1.5" aria-label="Remove item" onClick={() => updateConfig({ checklist: step.config.checklist.filter((x) => x.id !== c.id) })}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button className="btn btn-sm mt-2" onClick={() => updateConfig({ checklist: [...step.config.checklist, { id: newId(), text: '', done: false }] })}>
              <Plus className="h-4 w-4" /> Add item
            </button>
          </Section>

          {/* ---------------- Sign-off ---------------- */}
          <Section icon={PenLine} title="Sign-off Verification" badge={step.config.signoff.status} defaultOpen>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="AGAC engineer">
                <input className="input" value={step.config.signoff.engineer} onChange={(e) => updateConfig({ signoff: { ...step.config.signoff, engineer: e.target.value } })} />
              </Field>
              <Field label="Client witness">
                <input className="input" value={step.config.signoff.client} onChange={(e) => updateConfig({ signoff: { ...step.config.signoff, client: e.target.value } })} />
              </Field>
              <Field label="Date">
                <input type="date" className="input" value={step.config.signoff.date} onChange={(e) => updateConfig({ signoff: { ...step.config.signoff, date: e.target.value } })} />
              </Field>
              <Field label="Status">
                <select className="input" value={step.config.signoff.status} onChange={(e) => updateConfig({ signoff: { ...step.config.signoff, status: e.target.value } })}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="punch">Approved with punch list</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
