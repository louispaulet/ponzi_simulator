import { describe, expect, it } from 'vitest';
import { buildRecruitmentTree } from './Charts.jsx';

function snapshotWithCohorts(count) {
  return {
    cohorts: Array.from({ length: count }, (_, period) => ({
      period,
      joined: period === 0 ? 1 : period * 137,
      active: period === 0 ? 1 : period * 91,
    })),
  };
}

describe('recruitment tree aggregation', () => {
  it('compresses a long simulation to at most ten visible levels without losing people', () => {
    const snapshot = snapshotWithCohorts(37);
    const tree = buildRecruitmentTree(snapshot);
    const expectedJoined = snapshot.cohorts.reduce((sum, cohort) => sum + cohort.joined, 0);

    expect(tree).toHaveLength(10);
    expect(tree[0]).toMatchObject({ periodStart: 0, periodEnd: 0, collapsedCohorts: 1 });
    expect(tree.at(-1).periodEnd).toBe(36);
    expect(tree.reduce((sum, level) => sum + level.joined, 0)).toBe(expectedJoined);
    expect(tree.some((level) => level.collapsedCohorts > 1)).toBe(true);
  });

  it('uses labeled aggregate bubbles while keeping every level readable', () => {
    const tree = buildRecruitmentTree(snapshotWithCohorts(8));

    expect(tree).toHaveLength(8);
    tree.forEach((level) => {
      expect(level.nodes.length).toBeLessThanOrEqual(5);
      expect(level.nodes.reduce((sum, node) => sum + node.people, 0)).toBe(level.joined);
      expect(level.nodes.reduce((sum, node) => sum + node.active, 0)).toBe(level.active);
      expect(level.nodes.every((node) => node.people > 0)).toBe(true);
    });
  });
});
