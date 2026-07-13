import { describe, expect, it } from 'vitest';
import { adjustedMetric, caseById, cases, leaderboardFields, sortCases, sourceListForCase, sources } from './cases.js';

describe('historical case registry', () => {
  it('contains six uniquely identified cases', () => {
    expect(cases).toHaveLength(6);
    expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
  });

  it('uses null for unknown numeric facts instead of synthetic values', () => {
    const ponzi = caseById('charles-ponzi');
    expect(ponzi.affectedPeople.value).toBeNull();
    expect(ponzi.verifiedNetLoss.value).toBeNull();
  });

  it('resolves every cited source', () => {
    cases.forEach((caseRecord) => {
      caseRecord.sourceIds.forEach((sourceId) => expect(sources[sourceId]?.url, `${caseRecord.id}:${sourceId}`).toMatch(/^https:\/\//));
      expect(sourceListForCase(caseRecord)).toHaveLength(caseRecord.sourceIds.length);
    });
  });

  it('sorts known values while always placing unknown values last', () => {
    const sorted = sortCases(cases, 'verifiedNetLoss', 'desc');
    expect(sorted[0].id).toBe('madoff');
    expect(sorted.at(-1).verifiedNetLoss.value).toBeNull();
  });

  it('sorts dates and durations in both directions', () => {
    expect(sortCases(cases, 'start', 'asc')[0].id).toBe('charles-ponzi');
    expect(sortCases(cases, 'durationMonths', 'desc')[0].id).toBe('stanford');
  });

  it('publishes a sortable field definition for every requested statistic', () => {
    expect(leaderboardFields.map((field) => field.key)).toEqual([
      'affectedPeople',
      'grossRaised',
      'verifiedNetLoss',
      'moneyToTop',
      'recovered',
      'start',
      'end',
      'durationMonths',
    ]);
  });

  it('can express a fixed 2024-dollar comparison without changing the source record', () => {
    const ponzi = caseById('charles-ponzi');
    expect(adjustedMetric(ponzi.grossRaised, ponzi.inflationFactor2024, true)).toBe(235_200_000);
    expect(ponzi.grossRaised.value).toBe(15_000_000);
  });
});
