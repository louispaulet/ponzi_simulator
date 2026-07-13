import { Link } from 'react-router-dom';
import { PageMeta } from '../components/Layout.jsx';
import { articles } from '../data/articles.js';
import { caseById } from '../data/cases.js';
import { currency } from '../format.js';

const featuredCaseIds = ['madoff', 'zeek-rewards', 'burnlounge'];

export default function HomePage() {
  const featuredCases = featuredCaseIds.map(caseById);
  return (
    <>
      <PageMeta
        title="Ponzi Simulator"
        description="A source-backed educational simulator showing how Ponzi schemes, recruitment pyramids, and MLM compensation plans transfer money and collapse."
        canonicalPath="/"
      />
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div>
            <p className="eyebrow">An educational failure model</p>
            <h1>See the promise.<br /><span>Follow the money.</span></h1>
            <p className="lede">Build a hypothetical investment or recruitment scheme, inspect who gets paid, and watch finite people and cash turn growth into collapse.</p>
            <div className="button-row">
              <Link className="button button--primary" to="/simulator">Open the simulator</Link>
              <Link className="button button--secondary" to="/hall-of-harm">Explore sourced cases</Link>
            </div>
            <p className="source-line"><span aria-hidden="true">●</span> Historical facts cite public records. Model outputs are labeled separately.</p>
          </div>
          <div className="hero-model-card" aria-label="A simple flow showing how money moves through an unsustainable scheme">
            <div className="hero-model-header"><span>MODEL PREVIEW</span><span>PERIOD 12</span></div>
            <div className="hero-pyramid" aria-hidden="true">
              <span className="pyramid-node pyramid-node--top">12</span>
              <div><span className="pyramid-node">180</span><span className="pyramid-node">420</span></div>
              <div><span className="pyramid-node pyramid-node--loss">4.8K</span><span className="pyramid-node pyramid-node--loss">8.2K</span><span className="pyramid-node pyramid-node--loss">11K</span></div>
            </div>
            <div className="hero-flow-row"><span>Money moving upward</span><strong>$12.4M</strong></div>
            <div className="hero-risk"><span style={{ width: '82%' }} /></div>
            <div className="hero-flow-row"><span>Modeled collapse risk</span><strong>82%</strong></div>
          </div>
        </div>
      </section>

      <section className="stat-band" aria-label="Product coverage">
        <div className="container stat-grid">
          <div><strong>2</strong><span>Distinct simulation engines</span></div>
          <div><strong>6</strong><span>Source-backed case files</span></div>
          <div><strong>8</strong><span>Calibrated and sandbox replays</span></div>
          <div><strong>100%</strong><span>Seeded and reproducible</span></div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><p className="eyebrow">Two different mechanisms</p><h2>Choose the pressure you want to study</h2></div>
          <p>Investment Ponzis and recruitment pyramids both depend on later money, but they promise and distribute it differently.</p>
        </div>
        <div className="feature-grid feature-grid--two">
          <article className="feature-card feature-card--blue">
            <span className="feature-number">01</span>
            <h3>Investment Ponzi</h3>
            <p>Separate real reserves from claimed balances, then test returns, withdrawals, genuine revenue, and operator diversion.</p>
            <Link to="/simulator?scenario=custom-investment">Model an investment scheme <span aria-hidden="true">→</span></Link>
          </article>
          <article className="feature-card feature-card--green">
            <span className="feature-number">02</span>
            <h3>Recruitment pyramid / MLM</h3>
            <p>Configure fees, recurring purchases, retail demand, commission depth, and rank thresholds across a finite market.</p>
            <Link to="/simulator?scenario=custom-recruitment">Model a recruitment plan <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>

      <section className="section section--tinted">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Hall of Harm</p><h2>Compare evidence, not mythology</h2></div>
            <Link className="text-link" to="/hall-of-harm">View all sortable cases <span aria-hidden="true">→</span></Link>
          </div>
          <div className="case-card-grid">
            {featuredCases.map((item) => (
              <article className="case-preview-card" key={item.id}>
                <div className="case-preview-meta"><span>{item.typeLabel}</span><span>{item.legalStatus}</span></div>
                <h3><Link to={`/cases/${item.id}`}>{item.shortName}</Link></h3>
                <p>{item.summary}</p>
                <dl>
                  <div><dt>People</dt><dd>{item.affectedPeople.display}</dd></div>
                  <div><dt>Documented scale</dt><dd>{item.grossRaised.value ? currency(item.grossRaised.value) : item.verifiedNetLoss.display}</dd></div>
                </dl>
                <div className="card-actions"><Link to={`/cases/${item.id}`}>Read case</Link>{item.replayId ? <Link to={`/simulator?scenario=${item.replayId}`}>Replay</Link> : null}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div><p className="eyebrow">Build context</p><h2>Understand the system before the chart</h2></div>
          <Link className="text-link" to="/learn">Browse every guide <span aria-hidden="true">→</span></Link>
        </div>
        <div className="article-grid">
          {articles.slice(0, 3).map((article) => (
            <article className="article-card" key={article.id}>
              <p className="card-kicker">{article.eyebrow}</p>
              <h3><Link to={`/learn/${article.id}`}>{article.title}</Link></h3>
              <p>{article.description}</p>
              <span>{article.readTime}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="cta-panel">
          <div><p className="eyebrow">Start with the defaults</p><h2>Watch the math become visible.</h2><p>No signup. No real money. Every outcome is a deterministic educational model.</p></div>
          <Link className="button button--light" to="/simulator">Run the sandbox</Link>
        </div>
      </section>
    </>
  );
}
