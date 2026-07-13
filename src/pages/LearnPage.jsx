import { Link, useParams } from 'react-router-dom';
import { PageIntro, PageMeta } from '../components/Layout.jsx';
import { articleById, articles } from '../data/articles.js';
import { caseById } from '../data/cases.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function LearnPage() {
  const { articleId } = useParams();
  if (articleId) return <ArticlePage articleId={articleId} />;
  return (
    <>
      <PageMeta title="Learn" description="Plain-language guides to Ponzi schemes, recruitment pyramids, MLM compensation, and warning signs." canonicalPath="/learn" />
      <PageIntro eyebrow="Understand before you simulate" title="Learn how the pressure builds" description="Short, linked guides explain the mechanics, the incentives, and the warning signs behind the model." compact />
      <section className="section container">
        <div className="article-grid article-grid--large">
          {articles.map((article, index) => (
            <article className="article-card" key={article.id}>
              <div className="article-card-number">{String(index + 1).padStart(2, '0')}</div>
              <p className="card-kicker">{article.eyebrow}</p>
              <h2><Link to={`/learn/${article.id}`}>{article.title}</Link></h2>
              <p>{article.description}</p>
              <div><span>{article.readTime}</span><Link to={`/learn/${article.id}`}>Read guide <span aria-hidden="true">→</span></Link></div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function ArticlePage({ articleId }) {
  const article = articleById(articleId);
  if (!article) return <NotFoundPage />;
  return (
    <>
      <PageMeta title={article.title} description={article.description} canonicalPath={`/learn/${article.id}`} />
      <article>
        <header className="reading-hero">
          <div className="reading-container"><p className="eyebrow">{article.eyebrow}</p><h1>{article.title}</h1><p className="lede">{article.description}</p><span>{article.readTime}</span></div>
        </header>
        <div className="reading-layout container section">
          <div className="reading-body">
            {article.sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
              </section>
            ))}
            {article.id === 'mlm' || article.id === 'pyramid-schemes' ? (
              <aside className="source-callout"><strong>Primary guidance</strong><p>This guide follows the FTC’s distinction between retail demand and rewards driven primarily by recruitment or participant purchasing.</p><a href="https://consumer.ftc.gov/articles/multi-level-marketing-businesses-and-pyramid-schemes" target="_blank" rel="noreferrer">Read FTC consumer guidance</a></aside>
            ) : null}
          </div>
          <aside className="reading-sidebar">
            <div className="data-card sticky-card">
              <h2>Related cases</h2>
              {article.relatedCases.slice(0, 4).map((id) => { const item = caseById(id); return <Link key={id} to={`/cases/${id}`}><span>{item.shortName}</span><small>{item.typeLabel}</small></Link>; })}
              <h2>Keep reading</h2>
              {article.relatedArticles.slice(0, 3).map((id) => { const related = articleById(id); return <Link key={id} to={`/learn/${id}`}><span>{related.title}</span></Link>; })}
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
