import { describe, expect, it } from 'vitest';
import { articleById, articles } from './articles.js';
import { caseById } from './cases.js';
import { editableCopy, scenarioById, scenariosForKind } from '../scenarios.js';
import { SCHEME_KINDS } from '../simulation.js';

describe('learning registry', () => {
  it('resolves every cross-link between articles and cases', () => {
    expect(articles).toHaveLength(4);
    articles.forEach((article) => {
      article.relatedArticles.forEach((id) => expect(articleById(id), `${article.id}:${id}`).toBeDefined());
      article.relatedCases.forEach((id) => expect(caseById(id), `${article.id}:${id}`).toBeDefined());
      expect(article.sections.length).toBeGreaterThan(1);
    });
  });

  it('returns no article for an unknown id', () => {
    expect(articleById('missing')).toBeNull();
  });

  it('resolves scenario registries and creates an editable historical copy', () => {
    expect(scenarioById('missing').id).toBe('custom-recruitment');
    expect(scenariosForKind(SCHEME_KINDS.INVESTMENT).every((item) => item.kind === SCHEME_KINDS.INVESTMENT)).toBe(true);
    const copy = editableCopy(scenarioById('madoff'));
    expect(copy).toMatchObject({ id: 'madoff-what-if', immutable: false, historicalCaseId: 'madoff' });
    expect(copy.benchmarks).toEqual([]);
  });
});
