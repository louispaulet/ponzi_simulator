import { compact, currency, integer, percent } from '../format.js';

const chartColors = {
  joined: '#315ee7',
  active: '#16a085',
  danger: '#d94b5d',
  warning: '#d28a1d',
  ink: '#16203a',
};

export function GrowthChart({ history, currentIndex }) {
  const states = history.slice(0, currentIndex + 1);
  const width = 800;
  const height = 260;
  const padding = { left: 54, right: 18, top: 20, bottom: 38 };
  const maxLog = Math.max(1, ...states.map((state) => Math.log10(state.totalJoined + 1)));
  const pointFor = (state, index, key) => {
    const x = padding.left + (index / Math.max(states.length - 1, 1)) * (width - padding.left - padding.right);
    const y = height - padding.bottom - (Math.log10(state[key] + 1) / maxLog) * (height - padding.top - padding.bottom);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };
  const joinedPoints = states.map((state, index) => pointFor(state, index, 'totalJoined')).join(' ');
  const activePoints = states.map((state, index) => pointFor(state, index, 'activeParticipants')).join(' ');
  const latest = states.at(-1);

  return (
    <section className="data-card chart-card" aria-labelledby="growth-chart-heading">
      <div className="card-heading-row">
        <div>
          <p className="card-kicker">Recruitment pressure</p>
          <h2 id="growth-chart-heading">Participant growth</h2>
        </div>
        <span className="subtle-badge">Log scale</span>
      </div>
      <div className="chart-legend" aria-hidden="true">
        <span><i style={{ background: chartColors.joined }} />Joined {compact(latest.totalJoined)}</span>
        <span><i style={{ background: chartColors.active }} />Active {compact(latest.activeParticipants)}</span>
      </div>
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="growth-title growth-description">
        <title id="growth-title">Joined and active participants over time</title>
        <desc id="growth-description">At period {latest.period}, {integer(latest.totalJoined)} people have joined and {integer(latest.activeParticipants)} remain active. Values use a logarithmic scale.</desc>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = padding.top + fraction * (height - padding.top - padding.bottom);
          return <line key={fraction} x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="chart-gridline" />;
        })}
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} className="chart-axis" />
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} className="chart-axis" />
        <polyline points={joinedPoints} fill="none" stroke={chartColors.joined} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={activePoints} fill="none" stroke={chartColors.active} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <text x={padding.left} y={height - 12} className="chart-label">Start</text>
        <text x={width - padding.right} y={height - 12} textAnchor="end" className="chart-label">Period {latest.period}</text>
      </svg>
      <details className="data-table-details">
        <summary>View participant data</summary>
        <div className="table-scroll">
          <table>
            <thead><tr><th>Period</th><th>New</th><th>Active</th><th>Total joined</th></tr></thead>
            <tbody>
              {states.map((state) => (
                <tr key={state.period}><td>{state.period}</td><td>{integer(state.lastNewParticipants)}</td><td>{integer(state.activeParticipants)}</td><td>{integer(state.totalJoined)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function CashAllocation({ snapshot }) {
  const participantPayouts = snapshot.ledger.commissionsPaid + snapshot.ledger.withdrawalsPaid + snapshot.ledger.refundsPaid;
  const rows = [
    { label: 'Paid to participants', value: participantPayouts, color: '#315ee7' },
    { label: 'Operator take', value: snapshot.ledger.operatorTake, color: '#d94b5d' },
    { label: 'Product / operating costs', value: snapshot.ledger.productCosts, color: '#d28a1d' },
    { label: 'Cash reserves', value: snapshot.reserves, color: '#16a085' },
  ];
  const total = Math.max(1, rows.reduce((sum, row) => sum + row.value, 0));
  return (
    <section className="data-card" aria-labelledby="cash-heading">
      <div className="card-heading-row">
        <div><p className="card-kicker">Cash ledger</p><h2 id="cash-heading">Where the money went</h2></div>
        <span className="subtle-badge">{currency(snapshot.totalInflow)} in</span>
      </div>
      <div className="stacked-bar" role="img" aria-label={rows.map((row) => `${row.label}: ${currency(row.value)}`).join('. ')}>
        {rows.map((row) => <span key={row.label} style={{ width: `${(row.value / total) * 100}%`, background: row.color }} />)}
      </div>
      <dl className="legend-list">
        {rows.map((row) => (
          <div key={row.label}><dt><i style={{ background: row.color }} />{row.label}</dt><dd>{currency(row.value)}</dd></div>
        ))}
        <div className={snapshot.ledger.unpaidLiabilities > 0 ? 'is-danger' : ''}><dt>Unpaid liabilities</dt><dd>{currency(snapshot.ledger.unpaidLiabilities)}</dd></div>
      </dl>
    </section>
  );
}

export function OutcomeChart({ snapshot }) {
  const losers = Math.min(snapshot.totalJoined, snapshot.participantsWithNetLoss);
  const winners = Math.max(0, snapshot.totalJoined - losers);
  const loserShare = losers / Math.max(snapshot.totalJoined, 1);
  return (
    <section className="data-card" aria-labelledby="outcomes-heading">
      <div className="card-heading-row">
        <div><p className="card-kicker">Distribution</p><h2 id="outcomes-heading">Who carries the loss</h2></div>
        <span className={`risk-chip ${loserShare > 0.75 ? 'risk-chip--danger' : ''}`}>{percent(loserShare)} modeled losses</span>
      </div>
      <div className="outcome-bar" role="img" aria-label={`${integer(losers)} participants modeled at a net loss and ${integer(winners)} modeled as recovering their average stake`}>
        <span className="outcome-loss" style={{ width: `${loserShare * 100}%` }} />
        <span className="outcome-recovered" style={{ width: `${(1 - loserShare) * 100}%` }} />
      </div>
      <div className="outcome-labels">
        <div><strong>{compact(losers)}</strong><span>Modeled at net loss</span></div>
        <div><strong>{compact(winners)}</strong><span>Recovered average stake</span></div>
      </div>
      <p className="fine-print">Cohort estimate, not a claim about a historical victim count. Outcomes compare modeled payouts with the average participant stake.</p>
    </section>
  );
}

export function RankDistribution({ snapshot }) {
  const ranks = snapshot.config.recruitment.ranks;
  const max = Math.max(1, ...Object.values(snapshot.rankDistribution));
  return (
    <section className="data-card" aria-labelledby="ranks-heading">
      <div className="card-heading-row">
        <div><p className="card-kicker">Qualification funnel</p><h2 id="ranks-heading">Rank distribution</h2></div>
        <span className="subtle-badge">{integer(snapshot.profitableTopTierParticipants)} at top tier</span>
      </div>
      <div className="rank-bars">
        {ranks.map((rank, index) => {
          const value = snapshot.rankDistribution[rank.id] ?? 0;
          return (
            <div className="rank-row" key={rank.id}>
              <div><strong>{rank.name}</strong><span>{integer(value)}</span></div>
              <div className="rank-track"><span style={{ width: `${Math.max(value > 0 ? 2 : 0, (value / max) * 100)}%`, background: [chartColors.ink, chartColors.active, chartColors.warning, chartColors.danger][index % 4] }} /></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function EventTimeline({ snapshot }) {
  return (
    <section className="data-card" aria-labelledby="events-heading">
      <div className="card-heading-row"><div><p className="card-kicker">Model signals</p><h2 id="events-heading">What changed</h2></div></div>
      <ol className="event-list">
        {snapshot.events.slice(0, 6).map((event, index) => <li key={`${event}-${index}`}><span>{index === 0 ? 'Now' : `−${index}`}</span><p>{event}</p></li>)}
      </ol>
    </section>
  );
}
