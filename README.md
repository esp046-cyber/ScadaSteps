# ScadaSteps

Offline-capable Progressive Web App for SCADA / automation engineers at **Al Gurg Automation (AGAC)** - www.agac.ae, Jebel Ali, Dubai, UAE.

Build, configure, audit and simulate EIC project workflows (Planning & FEED → Design → PLC/DCS/SCADA development → FAT → Installation → SAT → Commissioning → Handover) for:

District Cooling · Oil & Gas · Water & Wastewater · Food & Beverage · Power Grid / Substations · Infrastructure · Metals & Minerals

## Features

| Tab | What it does |
|---|---|
| **Sector** | Load a pre-built sector template (steps, sample I/O, interlocks, network defaults) and fill in project details. |
| **Builder** | Drag-and-drop (or arrow buttons on touch) sequence editor, parallel branches, phase grouping and live IEC/ISA sequence validation. 35 library steps. |
| **Configure** | Per-step I/O mapping, ISA-5.1 tag checks, interlocks, loop-check tables, calibration records, network architecture (Profinet, Modbus, IEC 61850…), checklists and sign-off. |
| **Instructions** | AGAC-branded commissioning procedure / method statement with revision history, appendices (I/O, interlocks, loop sheets). Print to PDF, download HTML or Markdown. |
| **Gap Audit** | Rule-based audit for missing steps, wrong sequence and configuration errors against IEC 61511 / 62443 / 61850 / 62381, ISA-5.1 / 18.2 / 88 with one-click fixes and a health score. |
| **Simulate** | Run the workflow with dependency checks, move simulated field tags, trigger alarms / trips / ESD, comms loss, loop-check faults and verify interlock logic. |

Everything is stored in your browser (`localStorage`) and works fully offline after the first load.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in ./dist
npm run preview
```

Requires Node 18+.

## Deploy to GitHub Pages

1. Create a GitHub repository named `Scadasteps` and push this project to the `main` branch.
2. In the repository go to **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes automatically on every push to `main`.
4. The site will be available at `https://<your-user>.github.io/Scadasteps/`.

The build uses relative paths (`base: './'`), so it also works on any other static host.

## Install on a phone or tablet

Open the deployed URL in Chrome / Edge / Safari → **Install app** / **Add to Home Screen**. The service worker caches the app shell for use in remote plants without connectivity.

## Project structure

```
src/
  data/agacStandards.js     phases, step library, sector templates, audit rules
  utils/validation.js       sequence validation, gap analysis, loop-check maths
  utils/pdfExport.js        method-statement builder, print / download helpers
  components/               Header, Navigation, SectorSelector, WorkflowBuilder,
                            StepConfigurator, InstructionsGenerator, GapDetector, WorkflowSimulator
  hooks/useLocalStorage.js  persisted state
public/sw.js                offline service worker (copied to build root)
```

## Notes

Templates and rules are engineering aids that reflect common good practice. Always follow the project specification, client standards and applicable UAE authority requirements.
