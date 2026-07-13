import { Link } from 'react-router-dom';
import { PageMeta } from '../components/Layout.jsx';

export default function NotFoundPage() {
  return (
    <section className="not-found container">
      <PageMeta title="Page not found" description="The requested Ponzi Simulator page could not be found." canonicalPath="/404" />
      <p className="eyebrow">404</p><h1>This trail runs cold.</h1><p>The page may have moved, or the case identifier may be incorrect.</p>
      <div className="button-row"><Link className="button button--primary" to="/">Return home</Link><Link className="button button--secondary" to="/simulator">Open simulator</Link></div>
    </section>
  );
}
