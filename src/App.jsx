import React, { useCallback, useMemo, useState } from 'react';
import Header from './components/Header';
import Navigation from './components/Navigation';
import SectorSelector from './components/SectorSelector';
import WorkflowBuilder from './components/WorkflowBuilder';
import StepConfigurator from './components/StepConfigurator';
import InstructionsGenerator from './components/InstructionsGenerator';
import GapDetector from './components/GapDetector';
import WorkflowSimulator from './components/WorkflowSimulator';
import { useLocalStorage } from './hooks/useLocalStorage';
import { createWorkflowFromSector, sectorById } from './data/agacStandards';
import { analyzeWorkflow } from './utils/validation';

const DEFAULT_PROJECT = {
  name: '',
  client: '',
  site: 'Jebel Ali, Dubai, UAE',
  docNo: '',
  revision: 'A',
  author: '',
  reviewer: '',
  approver: '',
};

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="panel m-4 p-6">
        <h2 className="text-lg font-bold text-red-300">Something went wrong in this view</h2>
        <p className="mt-2 text-sm text-zinc-400">{String(this.state.error.message || this.state.error)}</p>
        <div className="mt-4 flex gap-2">
          <button className="btn" onClick={() => this.setState({ error: null })}>Try again</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              try { Object.keys(localStorage).filter((k) => k.startsWith('scadasteps.')).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
              location.reload();
            }}
          >
            Reset saved data
          </button>
        </div>
      </div>
    );
  }
}

export default function App() {
  const [tab, setTab] = useLocalStorage('scadasteps.tab', 'sector');
  const [project, setProject] = useLocalStorage('scadasteps.project', DEFAULT_PROJECT);
  const [sectorId, setSectorId] = useLocalStorage('scadasteps.sector', null);
  const [steps, setSteps] = useLocalStorage('scadasteps.steps', []);
  const [selectedId, setSelectedId] = useState(null);

  const sector = sectorById(sectorId);
  const doneCount = steps.filter((s) => s.config?.signoff?.status === 'approved').length;

  const loadTemplate = useCallback(
    (id) => {
      setSectorId(id);
      setSteps(createWorkflowFromSector(id));
      setSelectedId(null);
    },
    [setSectorId, setSteps]
  );

  const startBlank = useCallback(() => {
    setSteps([]);
    setSelectedId(null);
  }, [setSteps]);

  const gapCount = useMemo(() => {
    if (steps.length === 0) return 0;
    return analyzeWorkflow(steps, sectorId).issues.filter((i) => i.severity === 'critical').length;
  }, [steps, sectorId]);

  const goConfigure = (id) => {
    setSelectedId(id);
    setTab('configure');
  };

  const selectFromAudit = (id, target) => {
    setSelectedId(id);
    setTab(target);
  };

  const effectiveTab = ['sector', 'builder', 'configure', 'instructions', 'gaps', 'simulate'].includes(tab) ? tab : 'sector';

  // Configure tab always has something selected when steps exist
  const configSelected = selectedId && steps.some((s) => s.id === selectedId) ? selectedId : steps[0]?.id || null;

  return (
    <div className="flex min-h-full flex-col">
      <Header project={project} sector={sector} stepCount={steps.length} doneCount={doneCount} />
      <Navigation active={effectiveTab} onChange={setTab} badges={{ gaps: gapCount }} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-4 pb-24 sm:px-4 md:pb-8">
        <ErrorBoundary key={effectiveTab}>
          {effectiveTab === 'sector' && (
            <SectorSelector
              sectorId={sectorId}
              project={project}
              setProject={setProject}
              hasSteps={steps.length > 0}
              onLoadTemplate={loadTemplate}
              onStartBlank={startBlank}
              onGoBuilder={() => setTab('builder')}
            />
          )}
          {effectiveTab === 'builder' && (
            <WorkflowBuilder steps={steps} setSteps={setSteps} selectedId={selectedId} onSelect={setSelectedId} onConfigure={goConfigure} />
          )}
          {effectiveTab === 'configure' && (
            <StepConfigurator steps={steps} setSteps={setSteps} selectedId={configSelected} onSelect={setSelectedId} />
          )}
          {effectiveTab === 'instructions' && (
            <InstructionsGenerator steps={steps} sectorId={sectorId} project={project} setProject={setProject} />
          )}
          {effectiveTab === 'gaps' && (
            <GapDetector steps={steps} setSteps={setSteps} sectorId={sectorId} onSelectStep={selectFromAudit} />
          )}
          {effectiveTab === 'simulate' && <WorkflowSimulator steps={steps} />}
        </ErrorBoundary>
      </main>

      <footer className="hidden border-t border-scada-line py-3 text-center text-[11px] text-zinc-600 md:block">
        ScadaSteps · Al Gurg Automation (AGAC) · Jebel Ali, Dubai · www.agac.ae · Data is stored locally on this device.
      </footer>
    </div>
  );
}
