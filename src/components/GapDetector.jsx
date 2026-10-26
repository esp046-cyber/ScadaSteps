import React, { useMemo, useState } from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, PlusCircle, ShieldCheck, Wand2, Crosshair } from 'lucide-react';
import { analyzeWorkflow, insertStepByKey } from '../utils/validation';
import { sectorById } from '../data/agacStandards';

const SEV = {
  critical: { label: 'Critical', icon: AlertOctagon, cls: 'border-red-500/50 bg-red-500/10 text-red-300', dot: 'bg-red-400' },
  warning: { label: 'Warning', icon: AlertTriangle, cls: 'border-amber-500/50 bg-amber-500/10 text-amber-300', dot: 'bg-amber-400' },
  info: { label: 'Advisory', icon: Info, cls: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300', dot: 'bg-cyan-400' },
};

export default function GapDetector({ steps, setSteps, sectorId, onSelectStep }) {
  const [filter, setFilter] = useState('all');
  const sector = sectorById(sectorId);

  const { issues, score } = useMemo(() => analyzeWorkflow(steps, sectorId), [steps, sectorId]);

  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  const shown = filter === 'all' ? issues : issues.filter((i) => i.severity === filter);
  const fixable = issues.filter((i) => i.fixKey);

  const addOne = (key) => setSteps((prev) => (prev.some((s) => s.key === key) ? prev : insertStepByKey(prev, key)));
  const addAll = (list) =>
    setSteps((prev) => {
      let next = prev;
      list.forEach((i) => {
        if (!next.some((s) => s.key === i.fixKey)) next = insertStepByKey(next, i.fixKey);
      });
      return next;
    });

  const ring = score >= 85 ? '#34d399' : score >= 60 ? '#f5a524' : '#f87171';
  const circ = 2 * Math.PI * 42;

  if (steps.length === 0) {
    return <div className="panel p-8 text-center text-sm text-zinc-400">Nothing to audit yet - add steps in the Builder or load a sector template.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:h-fit">
        <div className="panel p-4 text-center">
          <h2 className="panel-title mb-3">Workflow health</h2>
          <div className="relative mx-auto h-32 w-32">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" role="img" aria-label={`Health score ${score} out of 100`}>
              <circle cx="50" cy="50" r="42" fill="none" stroke="#1f2937" strokeWidth="9" />
              <circle cx="50" cy="50" r="42" fill="none" stroke={ring} strokeWidth="9" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} style={{ transition: 'stroke-dashoffset .5s' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-zinc-100">{score}</span>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">/ 100</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">Audited against IEC / ISA standards and AGAC QA checklists{sector ? ` for ${sector.name}` : ''}.</p>
        </div>

        <div className="panel p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            {['critical', 'warning', 'info'].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(filter === k ? 'all' : k)}
                className={`rounded-md border p-2 transition ${filter === k ? SEV[k].cls : 'border-scada-line bg-zinc-950/40 text-zinc-300 hover:border-zinc-500'}`}
              >
                <div className="text-xl font-bold">{counts[k]}</div>
                <div className="text-[10px] uppercase tracking-wider">{SEV[k].label}</div>
              </button>
            ))}
          </div>
          {fixable.length > 0 && (
            <button className="btn btn-primary mt-3 w-full" onClick={() => addAll(fixable)}>
              <Wand2 className="h-4 w-4" /> Add all {fixable.length} missing steps
            </button>
          )}
        </div>
      </aside>

      <section className="min-w-0">
        {issues.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 p-10 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
            <h3 className="text-lg font-bold text-zinc-100">No gaps detected</h3>
            <p className="max-w-md text-sm text-zinc-400">Every required lifecycle step is present, correctly sequenced and configured for this sector.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {shown.map((i) => {
              const sev = SEV[i.severity];
              const Icon = sev.icon;
              return (
                <li key={i.id} className={`rounded-lg border p-3 ${sev.cls}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-zinc-100">{i.title}</h3>
                        <span className="chip border-current/40 bg-black/20">{i.standard}</span>
                        <span className="chip border-zinc-700 bg-black/20 text-zinc-300">
                          {i.type === 'missing' ? 'missing step' : i.type === 'order' ? 'sequence' : 'configuration'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">{i.detail}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {i.fixKey && (
                          <button className="btn btn-sm" onClick={() => addOne(i.fixKey)}>
                            <PlusCircle className="h-4 w-4" /> {i.fixLabel}
                          </button>
                        )}
                        {i.stepIds?.[0] && (
                          <button className="btn btn-sm" onClick={() => onSelectStep(i.stepIds[0], i.type === 'order' ? 'builder' : 'configure')}>
                            <Crosshair className="h-4 w-4" /> {i.type === 'order' ? 'Show in builder' : 'Open step'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="panel flex items-center gap-2 p-4 text-sm text-zinc-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No {filter} findings.</li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
