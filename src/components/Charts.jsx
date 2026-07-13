import { compact, currency, integer, percent } from '../format.js';
import { buildRecruitmentTree, MAX_TREE_LEVELS } from '../recruitmentTree.js';

const chartColors = {
  joined: '#315ee7',
  active: '#16a085',
  danger: '#d94b5d',
  warning: '#d28a1d',
  ink: '#16203a',
};

function positionedTree(snapshot) {
  const width = 720;
  const top = 58;
  const gap = 74;
  const levels = buildRecruitmentTree(snapshot).map((level, levelIndex) => {
    const minimumWidth = Math.max(0, (level.nodes.length - 1) * 92);
    const availableWidth = Math.min(width - 130, Math.max(minimumWidth, 120 + levelIndex * 60));
    return {
      ...level,
      y: top + levelIndex * gap,
      nodes: level.nodes.map((node, nodeIndex) => ({
        ...node,
        y: top + levelIndex * gap,
        x: level.nodes.length === 1
          ? width / 2
          : width / 2 - availableWidth / 2 + (nodeIndex / (level.nodes.length - 1)) * availableWidth,
        radius: 30 + Math.min(8, Math.log10(node.people + 1) * 2.2),
      })),
    };
  });
  const edges = levels.flatMap((level, levelIndex) => {
    if (levelIndex === 0) return [];
    const parents = levels[levelIndex - 1].nodes;
    return level.nodes.map((node, nodeIndex) => {
      const parentIndex = level.nodes.length === 1
        ? Math.floor((parents.length - 1) / 2)
        : Math.round((nodeIndex / (level.nodes.length - 1)) * Math.max(0, parents.length - 1));
      const parent = parents[parentIndex];
      const startY = node.y - node.radius;
      const endY = parent.y + parent.radius;
      const controlOffset = Math.max(18, (startY - endY) * 0.46);
      return {
        id: `${parent.id}-${node.id}`,
        path: `M ${node.x} ${startY} C ${node.x} ${startY - controlOffset}, ${parent.x} ${endY + controlOffset}, ${parent.x} ${endY}`,
      };
    });
  });
  return { width, height: top + Math.max(1, levels.length - 1) * gap + 72, levels, edges };
}

export function RecruitmentTree({ history, currentIndex }) {
  const states = history.slice(0, currentIndex + 1);
  const latest = states.at(-1);
  const tree = positionedTree(latest);
  const isCompressed = latest.cohorts.length > MAX_TREE_LEVELS;
  const periodFlow = latest.periodLedger.operatorTake + latest.periodLedger.commissionsPaid;

  return (
    <section className="data-card chart-card recruitment-tree-card" aria-labelledby="recruitment-tree-heading">
      <div className="card-heading-row">
        <div>
          <p className="card-kicker">People join. Money moves up.</p>
          <h2 id="recruitment-tree-heading">The recruitment tree</h2>
        </div>
        <span className="subtle-badge">{tree.levels.length} visible {tree.levels.length === 1 ? 'level' : 'levels'} · max 10</span>
      </div>
      <div className="tree-legend" aria-hidden="true">
        <span><i className="tree-legend-joined" />Joined {compact(latest.totalJoined)}</span>
        <span><i className="tree-legend-active" />Active {compact(latest.activeParticipants)}</span>
        <span><i className="tree-legend-money" />Moved upward {currency(latest.moneyMovedToTop)}</span>
      </div>
      <div className="recruitment-tree-scroll">
        <svg className="recruitment-tree" viewBox={`0 0 ${tree.width} ${tree.height}`} role="img" aria-labelledby="recruitment-tree-title recruitment-tree-description">
          <title id="recruitment-tree-title">Recruitment tree at period {latest.period}</title>
          <desc id="recruitment-tree-description">
            {integer(latest.totalJoined)} people are represented across {tree.levels.length} visible levels. Each bubble is labeled with the number of people grouped inside it. {isCompressed ? `${latest.cohorts.length} modeled cohort levels are compressed to a 10-level view.` : ''} Amber pulses show modeled money moving upward.
          </desc>
          <g className="tree-connections" aria-hidden="true">
            {tree.edges.map((edge) => <path key={edge.id} d={edge.path} />)}
          </g>
          {periodFlow > 0 ? (
            <g className="tree-money-flow" aria-hidden="true">
              {tree.edges.map((edge, index) => (
                <g key={edge.id}>
                  <path className="tree-money-trail" d={edge.path} />
                  <circle className="tree-money-pulse" r="3.5">
                    <animateMotion path={edge.path} dur={`${1.8 + (index % 4) * 0.22}s`} begin={`${-(index % 7) * 0.24}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </g>
          ) : null}
          {tree.levels.map((level, levelIndex) => (
            <g className="tree-level" key={level.id}>
              <text className="tree-level-label" x="24" y={level.y + 4}>
                {level.periodStart === level.periodEnd ? `P${level.periodStart}` : `P${level.periodStart}–${level.periodEnd}`}
              </text>
              {level.nodes.map((node) => {
                const activeShare = node.active / Math.max(node.people, 1);
                const tone = activeShare < 0.35 ? 'is-stressed' : levelIndex === tree.levels.length - 1 ? 'is-new' : 'is-active';
                return (
                  <g className={`tree-node ${tone}`} key={node.id} transform={`translate(${node.x} ${level.y})`}>
                    <title>{integer(node.people)} {node.people === 1 ? 'person' : 'people'} grouped in this bubble; {integer(node.active)} remain active.</title>
                    <circle r={node.radius} />
                    <text className="tree-node-count" textAnchor="middle" y="-2">{compact(node.people)}</text>
                    <text className="tree-node-unit" textAnchor="middle" y="13">{node.people === 1 ? 'person' : 'people'}</text>
                  </g>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      <div className="tree-explainer">
        <p><strong>How to read it</strong> New participants appear lower in the tree. Every bubble groups the number shown, while amber pulses trace this period’s {currency(periodFlow)} modeled upward flow.</p>
        {isCompressed ? <span>{latest.cohorts.length} cohort levels compressed into 10 readable levels</span> : <span>One modeled cohort per visible level</span>}
      </div>
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
