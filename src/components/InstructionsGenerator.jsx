import React, { useMemo, useState } from 'react';
import { Copy, Download, FileCode2, FileText, Printer } from 'lucide-react';
import { buildMarkdown, buildMethodStatement, downloadFile, exportToPdf, safeName } from '../utils/pdfExport';

export default function InstructionsGenerator({ steps, sectorId, project, setProject }) {
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [copied, setCopied] = useState(false);

  const doc = useMemo(
    () => buildMethodStatement(project, steps, sectorId, { date: generatedAt }),
    [project, steps, sectorId, generatedAt]
  );

  const base = safeName(project.docNo || project.name || 'ScadaSteps_Procedure');

  const copyMd = async () => {
    try {
      await navigator.clipboard.writeText(buildMarkdown(project, steps, sectorId));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      downloadFile(`${base}.md`, buildMarkdown(project, steps, sectorId), 'text/markdown');
    }
  };

  if (steps.length === 0) {
    return <div className="panel p-8 text-center text-sm text-zinc-400">Build a workflow first - the procedure is generated from your steps.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
      <aside className="panel h-fit p-4 xl:sticky xl:top-20">
        <h2 className="panel-title mb-3">Document control</h2>
        <div className="grid gap-3">
          {[
            ['name', 'Project'],
            ['client', 'Client'],
            ['site', 'Site'],
            ['docNo', 'Document No.'],
            ['revision', 'Revision'],
            ['author', 'Prepared by'],
            ['reviewer', 'Reviewed by'],
            ['approver', 'Approved by'],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="label" htmlFor={`ig-${k}`}>{label}</label>
              <input id={`ig-${k}`} className="input" value={project[k] || ''} onChange={(e) => setProject((p) => ({ ...p, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label" htmlFor="ig-date">Issue date</label>
            <input id="ig-date" type="date" className="input" value={generatedAt} onChange={(e) => setGeneratedAt(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <button className="btn btn-primary" onClick={() => exportToPdf(doc.html, doc.title)}>
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
          <button className="btn" onClick={() => downloadFile(`${base}.html`, doc.html, 'text/html')}>
            <FileCode2 className="h-4 w-4" /> Download HTML (opens in Word)
          </button>
          <button className="btn" onClick={() => downloadFile(`${base}.md`, buildMarkdown(project, steps, sectorId), 'text/markdown')}>
            <Download className="h-4 w-4" /> Download Markdown
          </button>
          <button className="btn" onClick={copyMd}>
            <Copy className="h-4 w-4" /> {copied ? 'Copied!' : 'Copy Markdown'}
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          The PDF uses your device&apos;s print dialog - choose &ldquo;Save as PDF&rdquo;. The document updates live as you edit steps, I/O points and interlocks.
        </p>
      </aside>

      <section className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
          <FileText className="h-4 w-4 text-amber-300" /> Live preview · {steps.length} steps
        </div>
        <div className="overflow-x-auto rounded-lg border border-scada-line bg-white shadow-xl">
          <style>{`.agac-preview { ${''} }`}</style>
          <iframe
            title="Procedure preview"
            className="h-[75vh] w-full min-w-[640px] bg-white"
            srcDoc={doc.html}
          />
        </div>
      </section>
    </div>
  );
}
