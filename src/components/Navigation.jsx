import React from 'react';
import { Factory, GitBranch, SlidersHorizontal, FileText, SearchCheck, PlayCircle } from 'lucide-react';

export const TABS = [
  { id: 'sector', label: 'Sector', icon: Factory },
  { id: 'builder', label: 'Builder', icon: GitBranch },
  { id: 'configure', label: 'Configure', icon: SlidersHorizontal },
  { id: 'instructions', label: 'Instructions', icon: FileText },
  { id: 'gaps', label: 'Gap Audit', icon: SearchCheck },
  { id: 'simulate', label: 'Simulate', icon: PlayCircle },
];

/** Top tab bar on desktop, fixed bottom bar on phones / tablets in portrait. */
export default function Navigation({ active, onChange, badges = {} }) {
  return (
    <>
      {/* desktop */}
      <nav className="hidden border-b border-scada-line bg-scada-panel/60 md:block">
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  on ? 'border-amber-400 text-amber-300' : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {badges[id] ? (
                  <span className="rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">{badges[id]}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* mobile */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-scada-line bg-scada-bg/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-6">
          {TABS.map(({ id, label, icon: Icon }) => {
            const on = active === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${
                  on ? 'text-amber-300' : 'text-zinc-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
                {badges[id] ? (
                  <span className="absolute right-3 top-1.5 rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">{badges[id]}</span>
                ) : null}
                {on && <span className="absolute inset-x-3 top-0 h-0.5 bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
