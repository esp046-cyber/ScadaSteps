import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, CheckCircle2, Copy, GitBranch, GripVertical, Plus, Search, Settings2, Trash2, PlusCircle,
} from 'lucide-react';
import { PHASES, STEP_LIBRARY, createCustomStep, createStep, phaseById } from '../data/agacStandards';
import { orderViolations } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

export default function WorkflowBuilder({ steps, setSteps, selectedId, onSelect, onConfigure }) {
  const [query, setQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [showLibrary, setShowLibrary] = useState(false);
  const dragId = useRef(null);
  const [overId, setOverId] = useState(null);

  const { byStep, list: violations } = useMemo(() => orderViolations(steps), [steps]);

  const present = useMemo(() => new Set(steps.map((s) => s.key)), [steps]);

  const library = STEP_LIBRARY.filter(
    (d) =>
      (phaseFilter === 'all' || d.phase === phaseFilter) &&
      (!query || d.name.toLowerCase().includes(query.toLowerCase()) || d.description.toLowerCase().includes(query.toLowerCase()))
  );

  /* ---------- mutations ---------- */
  const insertAt = (step) => {
    setSteps((prev) => {
      const idx = selectedId ? prev.findIndex((s) => s.id === selectedId) : -1;
      const at = idx === -1 ? prev.length : idx + 1;
      const next = [...prev];
      next.splice(at, 0, step);
      return next;
    });
    onSelect(step.id);
  };
  const addFromLibrary = (key) => insertAt(createStep(key));
  const addCustom = () => insertAt(createCustomStep(selectedId ? steps.find((s) => s.id === selectedId)?.phase : 'design'));

  const move = (id, dir) =>
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (id) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) onSelect(null);
  };

  const duplicate = (id) =>
    setSteps((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      if (i < 0) return prev;
      const src = prev[i];
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = uuidv4();
      copy.name = `${src.name} (copy)`;
      copy.config.checklist = (copy.config.checklist || []).map((c) => ({ ...c, id: uuidv4(), done: false }));
      copy.config.signoff = { engineer: '', client: '', date: '', status: 'pending' };
      const next = [...prev];
      next.splice(i + 1, 0, copy);
      return next;
    });

  const toggleParallel = (id) =>
    setSteps((prev) => prev.map((s, i) => (s.id === id && i > 0 ? { ...s, parallel: !s.parallel } : s)));

  const setPhase = (id, phase) => setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, phase } : s)));

  const dropOn = (targetId) => {
    const from = dragId.current;
    dragId.current = null;
    setOverId(null);
    if (!from || from === targetId) return;
    setSteps((prev) => {
      const a = prev.findIndex((s) => s.id === from);
      const b = prev.findIndex((s) => s.id === targetId);
      if (a < 0 || b < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(a, 1);
      next.splice(b, 0, moved);
      return next;
    });
  };

  /* ---------- derived ---------- */
  const phaseCounts = PHASES.map((p) => ({ ...p, n: steps.filter((s) => s.phase === p.id).length }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
      {/* ---------------- sequence ---------------- */}
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Workflow sequence</h2>
            <p className="text-xs text-zinc-400">
              Drag handles (or use arrows on touch) to reorder · tap <GitBranch className="inline h-3 w-3" /> to run a step in parallel with the previous one.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-sm xl:hidden" onClick={() => setShowLibrary((v) => !v)}>
              <Plus className="h-4 w-4" /> Step library
            </button>
            <button className="btn btn-sm" onClick={addCustom}>
              <PlusCircle className="h-4 w-4" /> Custom step
            </button>
          </div>
        </div>

        {/* phase summary */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {phaseCounts.map((p) => (
            <span key={p.id} className="chip border-zinc-700 bg-zinc-900 text-zinc-300">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.label.replace(/ \(.*\)/, '')} <b className="text-zinc-100">{p.n}</b>
            </span>
          ))}
        </div>

        {/* validation banner */}
        <div
          className={`mb-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
            violations.length ? 'border-red-500/50 bg-red-500/10 text-red-200' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          }`}
          role="status"
        >
          {violations.length ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <div className="min-w-0">
            {violations.length ? (
              <>
                <b>{violations.length} sequence {violations.length === 1 ? 'problem' : 'problems'}</b>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-red-200/90">
                  {violations.slice(0, 3).map((v) => (
                    <li key={v.before + v.after}>{v.text}</li>
                  ))}
                  {violations.length > 3 && <li>…and {violations.length - 3} more (see highlighted steps)</li>}
                </ul>
              </>
            ) : (
              <span>
                Sequence valid - {steps.length} steps, no ordering conflicts against IEC / ISA dependency rules.
              </span>
            )}
          </div>
        </div>

        {steps.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-zinc-400">
            Your workflow is empty. Pick a sector template, or add steps from the library.
          </div>
        ) : (
          <ol className="space-y-1.5">
            {steps.map((s, i) => {
              const ph = phaseById(s.phase);
              const prevPhase = i > 0 ? steps[i - 1].phase : null;
              const bad = byStep[s.id];
              const sel = s.id === selectedId;
              const done = s.config?.signoff?.status === 'approved';
              return (
                <React.Fragment key={s.id}>
                  {s.phase !== prevPhase && (
                    <li className="mt-3 flex items-center gap-2 first:mt-0" aria-hidden>
                      <span className="h-px flex-1" style={{ background: ph.color, opacity: 0.4 }} />
                      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: ph.color }}>{ph.label}</span>
                      <span className="h-px flex-1" style={{ background: ph.color, opacity: 0.4 }} />
                    </li>
                  )}
                  <li
                    draggable
                    onDragStart={(e) => {
                      dragId.current = s.id;
                      e.dataTransfer.effectAllowed = 'move';
                      try { e.dataTransfer.setData('text/plain', s.id); } catch { /* firefox */ }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (overId !== s.id) setOverId(s.id);
                    }}
                    onDragLeave={() => setOverId((o) => (o === s.id ? null : o))}
                    onDrop={(e) => {
                      e.preventDefault();
                      dropOn(s.id);
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                      setOverId(null);
                    }}
                    onClick={() => onSelect(s.id)}
                    className={`group relative flex flex-col gap-2 rounded-lg border bg-scada-panel p-2.5 transition sm:flex-row ${s.parallel ? 'ml-6 sm:ml-10' : ''} ${
                      sel ? 'border-amber-400 bg-amber-400/5' : bad ? 'border-red-500/60' : 'border-scada-line hover:border-zinc-500'
                    } ${overId === s.id ? 'ring-2 ring-cyan-400' : ''}`}
                  >
                    {s.parallel && <span className="absolute -left-4 top-0 h-full w-4 rounded-bl border-b border-l border-amber-500/60 sm:-left-7 sm:w-7" aria-hidden />}
                    <div className="flex min-w-0 flex-1 gap-2">
                    <GripVertical className="mt-1 h-5 w-5 shrink-0 cursor-grab text-zinc-600 group-hover:text-zinc-300" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded bg-zinc-800 px-1 font-mono text-[11px] text-zinc-300">{i + 1}</span>
                        <span className="font-semibold text-zinc-100">{s.name}</span>
                        {s.parallel && <span className="chip border-amber-500/50 bg-amber-500/10 text-amber-300"><GitBranch className="h-3 w-3" />parallel</span>}
                        {done && <span className="chip border-emerald-500/50 bg-emerald-500/10 text-emerald-300"><CheckCircle2 className="h-3 w-3" />signed</span>}
                        {bad && <span className="chip border-red-500/60 bg-red-500/10 text-red-300"><AlertTriangle className="h-3 w-3" />order</span>}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{s.description || 'No description'}</p>
                      {bad && sel && (
                        <ul className="mt-1 list-disc pl-4 text-xs text-red-300">
                          {[...new Set(bad)].map((m) => <li key={m}>{m}</li>)}
                        </ul>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {(s.standards || []).map((x) => (
                          <span key={x} className="chip border-cyan-500/30 bg-cyan-500/5 text-cyan-300">{x}</span>
                        ))}
                        {sel && (
                          <select
                            aria-label="Phase"
                            className="ml-auto rounded border border-scada-line bg-zinc-950 px-1.5 py-1 text-[11px] text-zinc-300"
                            value={s.phase}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setPhase(s.id, e.target.value)}
                          >
                            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:shrink-0 sm:flex-nowrap sm:items-start" onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-sm px-1.5" aria-label="Move up" disabled={i === 0} onClick={() => move(s.id, -1)}><ArrowUp className="h-4 w-4" /></button>
                      <button className="btn btn-sm px-1.5" aria-label="Move down" disabled={i === steps.length - 1} onClick={() => move(s.id, 1)}><ArrowDown className="h-4 w-4" /></button>
                      <button className={`btn btn-sm px-1.5 ${s.parallel ? 'border-amber-500/60 text-amber-300' : ''}`} aria-label="Toggle parallel branch" title="Run in parallel with previous step" disabled={i === 0} onClick={() => toggleParallel(s.id)}><GitBranch className="h-4 w-4" /></button>
                      <button className="btn btn-sm px-1.5" aria-label="Duplicate" title="Duplicate" onClick={() => duplicate(s.id)}><Copy className="h-4 w-4" /></button>
                      <button className="btn btn-cyan btn-sm px-1.5" aria-label="Configure" title="Configure step" onClick={() => onConfigure(s.id)}><Settings2 className="h-4 w-4" /></button>
                      <button className="btn btn-danger btn-sm px-1.5" aria-label="Delete" title="Delete" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </li>
                </React.Fragment>
              );
            })}
          </ol>
        )}
      </section>

      {/* ---------------- library ---------------- */}
      <aside className={`${showLibrary ? 'block' : 'hidden'} xl:block`}>
        <div className="panel sticky top-20 flex max-h-[calc(100vh-7rem)] flex-col p-3">
          <h3 className="panel-title mb-2">Step library</h3>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
            <input className="input pl-8" placeholder="Search steps…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select className="input mb-2" value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} aria-label="Filter by phase">
            <option value="all">All phases</option>
            {PHASES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <p className="mb-2 text-[11px] text-zinc-500">
            New steps insert {selectedId ? 'after the selected step' : 'at the end'}.
          </p>
          <ul className="-mr-1 flex-1 space-y-1 overflow-y-auto pr-1">
            {library.map((d) => {
              const used = present.has(d.key);
              return (
                <li key={d.key} className="flex items-center gap-2 rounded-md border border-scada-line bg-zinc-950/40 p-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: phaseById(d.phase).color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-zinc-200">{d.name}</div>
                    <div className="truncate text-[10px] text-zinc-500">{phaseById(d.phase).label}{used ? ' · in workflow' : ''}</div>
                  </div>
                  <button className="btn btn-sm px-1.5" aria-label={`Add ${d.name}`} onClick={() => addFromLibrary(d.key)}>
                    <Plus className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
            {library.length === 0 && <li className="p-3 text-center text-xs text-zinc-500">No steps match.</li>}
          </ul>
        </div>
      </aside>
    </div>
  );
}
