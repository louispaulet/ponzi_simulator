import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageIntro, PageMeta } from '../components/Layout.jsx';
import { adjustedMetric, cases, leaderboardFields, sortCases } from '../data/cases.js';
import { compact, currency, duration } from '../format.js';

const monetaryFields = new Set(['grossRaised', 'verifiedNetLoss', 'moneyToTop', 'recovered']);

export default function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const sort = leaderboardFields.some((field) => field.key === params.get('sort')) ? params.get('sort') : 'verifiedNetLoss';
  const direction = params.get('dir') === 'asc' ? 'asc' : 'desc';
  const type = params.get('type') ?? 'all';
  const status = params.get('status') ?? 'all';
  const adjusted = params.get('dollars') === '2024';

  const visibleCases = useMemo(() => {
    const filtered = cases.filter((item) => {
      if (type !== 'all' && item.schemeType !== type) return false;
      if (status === 'adjudicated' && item.legalStatus.includes('allegation')) return false;
      if (status === 'allegations' && !item.legalStatus.includes('allegation')) return false;
      return true;
    });
    return sortCases(filtered, sort, direction, { adjusted });
  }, [adjusted, direction, sort, status, type]);

  function update(next) {
    const updated = new URLSearchParams(params);
    Object.entries(next).forEach(([key, value]) => {
      if (value == null || value === 'all' || value === false) updated.delete(key);
      else updated.set(key, value === true ? '2024' : String(value));
    });
    setParams(updated, { replace: true });
  }

  function toggleSort(field) {
    update({ sort: field, dir: sort === field && direction === 'desc' ? 'asc' : 'desc' });
  }

  return (
    <>
      <PageMeta title="Hall of Harm" description="A sortable, source-qualified comparison of major Ponzi and pyramid cases." canonicalPath="/hall-of-harm" />
      <PageIntro eyebrow="Source-qualified case index" title="Hall of Harm" description="Compare documented impact without turning fraud into a competition. Unknown and disputed figures stay visible—and sort last." compact />
      <section className="container section leaderboard-section">
        <div className="filter-bar" aria-label="Leaderboard filters">
          <label>Scheme type
            <select value={type} onChange={(event) => update({ type: event.target.value })}>
              <option value="all">All types</option>
              <option value="investment-ponzi">Investment Ponzi</option>
              <option value="recruitment-pyramid">Recruitment pyramid / MLM</option>
            </select>
          </label>
          <label>Legal status
            <select value={status} onChange={(event) => update({ status: event.target.value })}>
              <option value="all">All statuses</option>
              <option value="adjudicated">Adjudicated / enforcement</option>
              <option value="allegations">Allegations only</option>
            </select>
          </label>
          <label className="toggle-control">
            <input type="checkbox" checked={adjusted} onChange={(event) => update({ dollars: event.target.checked })} />
            <span>Compare money in 2024 dollars</span>
          </label>
          <div className="mobile-sort-controls">
            <label>Sort by
              <select value={sort} onChange={(event) => update({ sort: event.target.value })}>
                {leaderboardFields.map((field) => <option key={field.key} value={field.key}>{field.label}</option>)}
              </select>
            </label>
            <button className="button button--secondary button--square" type="button" onClick={() => update({ dir: direction === 'desc' ? 'asc' : 'desc' })} aria-label={`Sort ${direction === 'desc' ? 'ascending' : 'descending'}`}>
              {direction === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>

        <p className="results-note">Showing {visibleCases.length} cases. Monetary definitions differ; open a case to read each qualifier.</p>

        <div className="leaderboard-table-wrap">
          <table className="leaderboard-table">
            <caption className="sr-only">Historical cases sorted by {leaderboardFields.find((field) => field.key === sort)?.label} {direction}</caption>
            <thead>
              <tr>
                <th scope="col">Case</th>
                {leaderboardFields.map((field) => (
                  <th key={field.key} scope="col" aria-sort={sort === field.key ? (direction === 'desc' ? 'descending' : 'ascending') : 'none'}>
                    <button type="button" onClick={() => toggleSort(field.key)}>{field.label}<span aria-hidden="true">{sort === field.key ? (direction === 'desc' ? ' ↓' : ' ↑') : ''}</span></button>
                  </th>
                ))}
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visibleCases.map((item, index) => (
                <tr key={item.id}>
                  <th scope="row"><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><Link to={`/cases/${item.id}`}>{item.shortName}</Link><small>{item.typeLabel}</small></th>
                  <td><MetricValue item={item} field="affectedPeople" adjusted={adjusted} /></td>
                  <td><MetricValue item={item} field="grossRaised" adjusted={adjusted} /></td>
                  <td><MetricValue item={item} field="verifiedNetLoss" adjusted={adjusted} /></td>
                  <td><MetricValue item={item} field="moneyToTop" adjusted={adjusted} /></td>
                  <td><MetricValue item={item} field="recovered" adjusted={adjusted} /></td>
                  <td>{item.start.label}</td>
                  <td>{item.end.label}</td>
                  <td>{duration(item.durationMonths)}</td>
                  <td><Link className="table-action" to={`/cases/${item.id}`}>Details</Link>{item.replayId ? <Link className="table-action" to={`/simulator?scenario=${item.replayId}`}>Replay</Link> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="leaderboard-cards">
          {visibleCases.map((item, index) => (
            <article className="leaderboard-card" key={item.id}>
              <div className="leaderboard-card-head"><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="status-badge">{item.legalStatus}</span></div>
              <h2><Link to={`/cases/${item.id}`}>{item.shortName}</Link></h2>
              <p>{item.typeLabel} · {item.start.label}–{item.end.label}</p>
              <dl>
                <div><dt>People affected</dt><dd><MetricValue item={item} field="affectedPeople" adjusted={adjusted} /></dd></div>
                <div><dt>Money raised</dt><dd><MetricValue item={item} field="grossRaised" adjusted={adjusted} /></dd></div>
                <div><dt>Verified harm</dt><dd><MetricValue item={item} field="verifiedNetLoss" adjusted={adjusted} /></dd></div>
                <div><dt>Duration</dt><dd>{duration(item.durationMonths)}</dd></div>
              </dl>
              <div className="card-actions"><Link to={`/cases/${item.id}`}>Read case</Link>{item.replayId ? <Link to={`/simulator?scenario=${item.replayId}`}>Replay</Link> : null}</div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function MetricValue({ item, field, adjusted }) {
  const record = item[field];
  if (!record || typeof record !== 'object') return null;
  const value = adjustedMetric(record, item.inflationFactor2024, adjusted && monetaryFields.has(field));
  const display = value == null ? record.display : field === 'affectedPeople' ? compact(value) : currency(value);
  return <span className="qualified-value" title={record.qualifier}>{display}{adjusted && value != null && monetaryFields.has(field) ? <small>2024 USD</small> : null}</span>;
}
