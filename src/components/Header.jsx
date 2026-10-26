import React, { useEffect, useState } from 'react';
import { Download, Radio, WifiOff, Wifi, Activity } from 'lucide-react';
import { COMPANY } from '../data/agacStandards';

export default function Header({ project, sector, stepCount, doneCount }) {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [installEvt, setInstallEvt] = useState(null);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    const beforeInstall = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    window.addEventListener('beforeinstallprompt', beforeInstall);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener('beforeinstallprompt', beforeInstall);
    };
  }, []);

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
  };

  const pct = stepCount ? Math.round((doneCount / stepCount) * 100) : 0;

  return (
    <header className="sticky top-0 z-30 border-b border-scada-line bg-scada-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/60 bg-amber-500/10">
          <Activity className="h-5 w-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h1 className="truncate text-base font-extrabold tracking-wide text-zinc-100 sm:text-lg">
              Scada<span className="text-amber-400">Steps</span>
            </h1>
            <span className="hidden text-[11px] uppercase tracking-widest text-zinc-500 sm:inline">{COMPANY.short} · {COMPANY.web}</span>
          </div>
          <p className="truncate text-xs text-zinc-400">
            {project.name || 'Untitled project'}
            {sector ? <span className="text-cyan-400"> · {sector.name}</span> : <span className="text-zinc-500"> · no sector selected</span>}
          </p>
        </div>

        {stepCount > 0 && (
          <div className="hidden w-32 sm:block" title={`${doneCount} of ${stepCount} steps signed off`}>
            <div className="mb-0.5 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
              <span>Sign-off</span>
              <span className="text-zinc-300">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded bg-zinc-800">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <span
          className={`chip ${online ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/50 bg-amber-500/10 text-amber-300'}`}
          title={online ? 'Online' : 'Offline mode - everything still works and saves locally'}
        >
          {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </span>

        {installEvt && (
          <button className="btn btn-primary btn-sm" onClick={install}>
            <Download className="h-3.5 w-3.5" /> Install
          </button>
        )}
        {!installEvt && (
          <Radio className="hidden h-4 w-4 text-zinc-600 sm:block" title="PWA ready" />
        )}
      </div>
    </header>
  );
}
