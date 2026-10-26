import React, { useState } from 'react';
import { Check, FilePlus2, Layers, Building2, Snowflake, Flame, Droplets, Utensils, Zap, Mountain } from 'lucide-react';
import { SECTORS, VENDORS, STEP_LIBRARY } from '../data/agacStandards';

const ICONS = { Snowflake, Flame, Droplets, Utensils, Zap, Mountain, Building2 };

export default function SectorSelector({ sectorId, project, setProject, hasSteps, onLoadTemplate, onStartBlank, onGoBuilder }) {
  const [pending, setPending] = useState(null);

  const choose = (id) => {
    if (hasSteps && id !== sectorId) setPending(id);
    else {
      onLoadTemplate(id);
      onGoBuilder();
    }
  };

  const set = (k) => (e) => setProject((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Select a sector template</h2>
            <p className="text-sm text-zinc-400">
              Pre-loaded EIC lifecycle workflows - Planning &amp; FEED through Commissioning &amp; Handover - with sample I/O and interlocks.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SECTORS.map((s) => {
            const Icon = ICONS[s.icon] || Layers;
            const on = s.id === sectorId;
            return (
              <button
                key={s.id}
                onClick={() => choose(s.id)}
                className={`panel group relative p-4 text-left transition hover:border-amber-400/60 hover:bg-scada-panel2 ${
                  on ? 'border-amber-400 bg-amber-400/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-md border p-2 ${on ? 'border-amber-400/60 bg-amber-400/10 text-amber-300' : 'border-scada-line bg-zinc-900 text-cyan-300'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-100">{s.name}</h3>
                      {on && <Check className="h-4 w-4 text-amber-300" />}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-400">{s.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.vendors.map((v) => (
                        <span key={v} className="chip border-zinc-700 bg-zinc-900 text-zinc-300">
                          {VENDORS.find((x) => x.id === v)?.name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      {s.steps.length} steps · {s.standards.slice(0, 3).join(' · ')}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button className="btn" onClick={() => { onStartBlank(); onGoBuilder(); }}>
            <FilePlus2 className="h-4 w-4" /> Start with a blank workflow
          </button>
          <span className="text-xs text-zinc-500">{STEP_LIBRARY.length} library steps available in the Builder.</span>
        </div>
      </section>

      <aside className="panel h-fit p-4">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-amber-300" />
          <h3 className="panel-title">Project details</h3>
        </div>
        <p className="mb-3 text-xs text-zinc-500">Used in the generated Method Statement header. Saved on this device.</p>
        <div className="grid gap-3">
          {[
            ['name', 'Project name', 'e.g. Business Bay DCP-4 Chiller Plant'],
            ['client', 'Client', 'Client / End user'],
            ['site', 'Site / location', 'e.g. Jebel Ali, Dubai'],
            ['docNo', 'Document number', 'AGAC-PRJ-COM-001'],
            ['revision', 'Revision', 'A'],
            ['author', 'Prepared by', ''],
            ['reviewer', 'Reviewed by', ''],
            ['approver', 'Approved by', ''],
          ].map(([k, label, ph]) => (
            <div key={k}>
              <label className="label" htmlFor={`proj-${k}`}>{label}</label>
              <input id={`proj-${k}`} className="input" value={project[k] || ''} onChange={set(k)} placeholder={ph} />
            </div>
          ))}
        </div>
      </aside>

      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="panel max-w-md p-5">
            <h3 className="text-base font-bold text-zinc-100">Replace current workflow?</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Loading the <b className="text-amber-300">{SECTORS.find((s) => s.id === pending)?.name}</b> template will replace your current steps and
              configuration. This cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => setPending(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onLoadTemplate(pending);
                  setPending(null);
                  onGoBuilder();
                }}
              >
                Replace workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
