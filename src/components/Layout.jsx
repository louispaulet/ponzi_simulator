import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const navigation = [
  { to: '/simulator', label: 'Simulator' },
  { to: '/hall-of-harm', label: 'Hall of Harm' },
  { to: '/learn', label: 'Learn' },
  { to: '/methodology', label: 'Methodology' },
];

export function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/" aria-label="Ponzi Simulator home">
            <span className="brand-mark" aria-hidden="true">P</span>
            <span>
              <strong>Ponzi Simulator</strong>
              <small>Follow the money</small>
            </span>
          </Link>
          <button
            className="menu-button"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true">{menuOpen ? 'Close' : 'Menu'}</span>
            <span className="sr-only">Toggle navigation</span>
          </button>
          <nav id="primary-navigation" className={`primary-navigation ${menuOpen ? 'is-open' : ''}`} aria-label="Primary navigation">
            {navigation.map((item) => (
              <NavLink key={item.to} className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')} to={item.to}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <Link className="brand footer-brand" to="/">
              <span className="brand-mark" aria-hidden="true">P</span>
              <span><strong>Ponzi Simulator</strong></span>
            </Link>
            <p>An educational model of how unsustainable promises and recruitment incentives transfer harm.</p>
          </div>
          <div>
            <h2>Explore</h2>
            <Link to="/simulator">Run a simulation</Link>
            <Link to="/hall-of-harm">Compare sourced cases</Link>
            <Link to="/learn">Read the guides</Link>
          </div>
          <div>
            <h2>Transparency</h2>
            <Link to="/methodology">Methodology and sources</Link>
            <a href="https://consumer.ftc.gov/articles/multi-level-marketing-businesses-and-pyramid-schemes" target="_blank" rel="noreferrer">FTC consumer guidance</a>
            <p className="footer-note">Education only. Not legal, financial, or operational advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PageMeta({ title, description, canonicalPath = '' }) {
  useEffect(() => {
    const fullTitle = title === 'Ponzi Simulator' ? title : `${title} | Ponzi Simulator`;
    document.title = fullTitle;
    setMeta('description', description);
    setPropertyMeta('og:title', fullTitle);
    setPropertyMeta('og:description', description);
    setPropertyMeta('og:url', `https://ponzi.thefrenchartist.dev${canonicalPath}`);
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = `https://ponzi.thefrenchartist.dev${canonicalPath}`;
  }, [canonicalPath, description, title]);
  return null;
}

export function PageIntro({ eyebrow, title, description, actions, compact = false }) {
  return (
    <section className={`page-intro ${compact ? 'page-intro--compact' : ''}`}>
      <div className="container">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className="lede">{description}</p>
        {actions ? <div className="button-row">{actions}</div> : null}
      </div>
    </section>
  );
}

function setMeta(name, content) {
  let element = document.querySelector(`meta[name="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.name = name;
    document.head.append(element);
  }
  element.content = content;
}

function setPropertyMeta(property, content) {
  let element = document.querySelector(`meta[property="${property}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.append(element);
  }
  element.content = content;
}
