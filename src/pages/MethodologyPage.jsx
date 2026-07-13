import { Link } from 'react-router-dom';
import { PageIntro, PageMeta } from '../components/Layout.jsx';
import { sources } from '../data/cases.js';

export default function MethodologyPage() {
  return (
    <>
      <PageMeta title="Methodology and Sources" description="How the simulator separates historical facts from deterministic educational models." canonicalPath="/methodology" />
      <PageIntro eyebrow="Transparent by design" title="Methodology and sources" description="What the model calculates, what it deliberately leaves unknown, and how each historical replay is checked." compact />
      <div className="container methodology-layout section">
        <article className="reading-body methodology-body">
          <section><h2>Two engines, one cash ledger</h2><p>Investment Ponzi replays track deposits, genuine revenue, claimed balances, withdrawals, reserves, operator diversion, and unpaid claims. Recruitment replays track joining fees, participant purchases, retail revenue, commissions by trigger and upline depth, refunds, product costs, ranks, and operator take.</p><p>Every period applies a cash-conservation invariant: opening reserves plus real inflows must equal real outflows plus closing reserves. Fictitious account balances are liabilities, not cash.</p></section>
          <section><h2>Seeded cohort simulation</h2><p>The model groups participants into time cohorts instead of pretending to reconstruct every person. A seeded random generator adds limited recruitment variation while keeping a given configuration exactly reproducible.</p><p>Modeled participant losses compare cohort payouts with an average stake. They are useful for comparing settings inside the simulator, but they are not historical victim counts.</p></section>
          <section><h2>Historical calibration</h2><p>Each replay has an immutable fact record and a separate simulation configuration. Benchmarks define documented windows and scale ranges, and automated tests fail if a replay leaves its declared range.</p><p>Madoff is a good example of why this matters: fabricated statement balances, cash-in/cash-out claims, direct accounts, indirect victims, recoveries, and forfeiture judgments are different measures. The interface keeps their labels attached.</p></section>
          <section><h2>Nominal and 2024 dollars</h2><p>The Hall of Harm shows source-year nominal values by default. Its optional comparison uses fixed annual CPI factors to express monetary fields in 2024 dollars. The converted value is a comparison aid; the original sourced value remains unchanged.</p></section>
          <section><h2>Limits</h2><ul><li>The simulator is an educational pressure model, not forensic accounting.</li><li>Unknown or disputed figures remain unknown and sort after known values.</li><li>Legal status is stated explicitly, including when a source contains allegations rather than a final adjudication.</li><li>The model does not provide advice for operating, promoting, concealing, or evading detection of a real scheme.</li></ul></section>
        </article>
        <aside className="methodology-sources">
          <div className="data-card sticky-card"><p className="card-kicker">Source registry</p><h2>Primary references</h2>{Object.entries(sources).map(([id, source]) => <a key={id} href={source.url} target="_blank" rel="noreferrer"><strong>{source.organization}</strong><span>{source.title}</span></a>)}</div>
          <div className="context-card"><h2>Inspect the data</h2><p>Every case page attaches qualifiers and source links directly to its figures.</p><Link to="/hall-of-harm">Open Hall of Harm <span aria-hidden="true">→</span></Link></div>
        </aside>
      </div>
    </>
  );
}
