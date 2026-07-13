import { Link, useParams } from 'react-router-dom';
import { PageMeta } from '../components/Layout.jsx';
import { caseById, sourceListForCase } from '../data/cases.js';
import { currency, duration } from '../format.js';
import NotFoundPage from './NotFoundPage.jsx';

const metricFields = [
  ['affectedPeople', 'People affected'],
  ['grossRaised', 'Money raised'],
  ['verifiedNetLoss', 'Verified harm'],
  ['moneyToTop', 'Moved upward'],
  ['recovered', 'Recovered / ordered'],
  ['fictitiousBalance', 'Fictitious balance'],
];

export default function CasePage() {
  const { caseId } = useParams();
  const item = caseById(caseId);
  if (!item) return <NotFoundPage />;
  const sourceList = sourceListForCase(item);
  return (
    <>
      <PageMeta title={item.shortName} description={item.summary} canonicalPath={`/cases/${item.id}`} />
      <article>
        <header className="case-hero">
          <div className="container">
            <div className="case-preview-meta"><span>{item.typeLabel}</span><span>{item.legalStatus}</span></div>
            <h1>{item.name}</h1>
            <p className="lede">{item.summary}</p>
            <div className="button-row">
              {item.replayId ? <Link className="button button--primary" to={`/simulator?scenario=${item.replayId}`}>Replay the sourced baseline</Link> : null}
              <Link className="button button--secondary" to="/hall-of-harm">Back to Hall of Harm</Link>
            </div>
          </div>
        </header>
        <div className="container case-layout section">
          <div className="case-main">
            <section>
              <p className="eyebrow">What happened</p>
              <h2>A sourced overview</h2>
              <p className="article-prose">{item.narrative}</p>
              <ul className="fact-list">{item.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
            </section>
            <section>
              <p className="eyebrow">Reported figures</p>
              <h2>Metrics with their definitions attached</h2>
              <div className="metric-detail-grid">
                {metricFields.map(([field, label]) => {
                  const record = item[field];
                  return (
                    <article className="metric-detail" key={field}>
                      <span>{label}</span>
                      <strong>{record.value != null ? (field === 'affectedPeople' ? Intl.NumberFormat('en-US').format(record.value) : currency(record.value)) : record.display}</strong>
                      <p>{record.qualifier}</p>
                    </article>
                  );
                })}
              </div>
            </section>
            <section>
              <p className="eyebrow">Primary references</p>
              <h2>Read the source records</h2>
              <ol className="source-list">
                {sourceList.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer"><strong>{source.organization}</strong><span>{source.title}</span></a></li>)}
              </ol>
            </section>
          </div>
          <aside className="case-sidebar">
            <div className="data-card sticky-card">
              <p className="card-kicker">Case timeline</p>
              <dl className="case-facts">
                <div><dt>Started</dt><dd>{item.start.label}<small>{item.start.precision}</small></dd></div>
                <div><dt>Ended / charged</dt><dd>{item.end.label}<small>{item.end.precision}</small></dd></div>
                <div><dt>Duration</dt><dd>{duration(item.durationMonths)}</dd></div>
                <div><dt>Legal status</dt><dd>{item.legalStatus}</dd></div>
              </dl>
              {item.replayId ? <Link className="button button--primary button--full" to={`/simulator?scenario=${item.replayId}`}>Open replay</Link> : null}
            </div>
            <div className="context-card">
              <h2>Continue learning</h2>
              <Link to={item.schemeType === 'investment-ponzi' ? '/learn/ponzi-schemes' : '/learn/pyramid-schemes'}>How this structure works <span aria-hidden="true">→</span></Link>
              <Link to="/learn/warning-signs">Review warning signs <span aria-hidden="true">→</span></Link>
              <Link to="/methodology">How replays are calibrated <span aria-hidden="true">→</span></Link>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
