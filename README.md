# Ponzi Simulator

Ponzi Simulator is a responsive educational product for exploring how investment Ponzi schemes and recruitment-driven pyramid/MLM schemes move money, concentrate gains, and collapse. It combines a deterministic cohort simulator, accessible data visualizations, source-backed historical replays, a sortable Hall of Harm, and connected learning material.

The simulations are educational models, not instructions for operating a scheme or forensic reconstructions of historical cases.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Commands

```bash
npm run test           # unit and component tests
npm run test:coverage  # tests with coverage thresholds
npm run test:e2e       # Chromium, Firefox, and WebKit browser tests
npm run build          # production build plus 200-status route entries and fallback
npm run check          # complete release gate
npm run deploy         # gate, then publish dist to GitHub Pages
```

Equivalent `make up`, `make test`, `make check`, `make build`, and `make deploy` targets are available.

## Product areas

- **Simulator** — choose investment Ponzi or pyramid/MLM mode; configure money flow, recruitment, commissions, ranks, shocks, and playback.
- **Historical replays** — immutable factual baselines with editable “Make a copy” what-if variants and benchmark tolerances.
- **Hall of Harm** — source-backed cases sortable by impact, money, recovery, dates, and duration, with URL-persisted filters.
- **Case and learning pages** — linked explainers, case records, citations, methodology, and accessible chart alternatives.

## Model and data

The seeded cohort engine uses discriminated investment and recruitment configurations. Every period records participant payments, retail revenue, commissions, withdrawals, refunds, product costs, operator take, reserves, and unpaid liabilities in a cash ledger. Validation covers configuration ranges, rank ordering, commission limits, finite populations, deterministic reproduction, and cash conservation.

Historical facts are stored separately from replay calibration. Unknown or disputed figures stay unset rather than being inferred. Each case links to its authoritative public sources.

## Quality gate

`npm run check` must pass before deployment. It enforces:

- unit and React component tests with coverage thresholds;
- a production build and GitHub Pages deep-route fallback;
- Playwright tests in Chromium, Firefox, and WebKit;
- responsive checks from 320px through 1920px;
- axe accessibility checks and Chromium visual-regression baselines.

The production site is [ponzi.thefrenchartist.dev](https://ponzi.thefrenchartist.dev/).
