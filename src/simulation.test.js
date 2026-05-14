import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  createRng,
  drawRecruitCount,
  levelRows,
  runSimulation,
  stepSimulation,
} from './simulation.js';
import { scenarios } from './scenarios.js';

describe('ponzi simulation', () => {
  it('draws recruit counts around the target', () => {
    const rng = createRng(123);
    const samples = Array.from({ length: 10_000 }, () => drawRecruitCount(4, rng));
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    expect(mean).toBeGreaterThan(3.6);
    expect(mean).toBeLessThan(4.4);
  });

  it('tracks level counts and cumulative population at or above each level', () => {
    const state = {
      levels: [1, 3, 9, 27],
    };
    expect(levelRows(state)).toEqual([
      { level: 0, count: 1, cumulative: 1 },
      { level: 1, count: 3, cumulative: 4 },
      { level: 2, count: 9, cumulative: 13 },
      { level: 3, count: 27, cumulative: 40 },
    ]);
  });

  it('updates inflow and payout liabilities after one month', () => {
    const rng = createRng(4);
    const initial = createInitialState({
      monthlyContribution: 100,
      targetRecruitsPerPerson: 3,
      promisedReturnMonthly: 0.2,
      withdrawalRate: 0.1,
      initialReserve: 0,
    });
    const next = stepSimulation(initial, rng);
    expect(next.month).toBe(1);
    expect(next.totalInflow).toBe(next.lastNewParticipants * 100);
    expect(next.totalPaidOut + next.unpaidLiabilities).toBeGreaterThanOrEqual(0);
    expect(next.totalJoined).toBe(1 + next.lastNewParticipants);
  });

  it('ends when the world population cap is reached', () => {
    const states = runSimulation(
      {
        monthlyContribution: 100,
        targetRecruitsPerPerson: 10,
        promisedReturnMonthly: 0.05,
        worldPopulation: 50,
        maxMonths: 12,
        seed: 88,
      },
      12,
    );
    expect(states.at(-1).ended).toBe(true);
    expect(states.at(-1).endReason).toBe('World population saturation');
  });

  it('ends when payout obligations exceed the modeled money cap', () => {
    const next = stepSimulation(
      createInitialState({
        monthlyContribution: 1_000_000,
        targetRecruitsPerPerson: 1,
        promisedReturnMonthly: 10,
        globalMoneyCap: 100,
        seed: 3,
      }),
      createRng(3),
    );
    expect(next.ended).toBe(true);
    expect(next.endReason).toBe('Not enough money in the world');
  });

  it('eventually collapses when recruiting cannot cover promised payouts', () => {
    const states = runSimulation(
      {
        monthlyContribution: 500,
        targetRecruitsPerPerson: 0,
        promisedReturnMonthly: 1.2,
        withdrawalRate: 0.5,
        maxMonths: 24,
        seed: 10,
      },
      24,
    );
    expect(states.at(-1).ended).toBe(true);
    expect(['Scheme collapse', 'Operator flees']).toContain(states.at(-1).endReason);
  });

  it('loads all historical and sandbox scenarios with valid parameters', () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(4);
    scenarios.forEach((scenario) => {
      expect(scenario.name).toBeTruthy();
      expect(scenario.monthlyContribution).toBeGreaterThan(0);
      expect(scenario.targetRecruitsPerPerson).toBeGreaterThanOrEqual(0);
      expect(scenario.seed).toBeGreaterThan(0);
    });
  });

  it('historical watch scenarios fail from collapse dynamics instead of just reaching the horizon', () => {
    scenarios
      .filter((scenario) => scenario.mode === 'watch')
      .forEach((scenario) => {
        const states = runSimulation(scenario, 120);
        const final = states.at(-1);
        const maxRisk = Math.max(...states.map((state) => state.collapseRisk));

        expect(final.endReason).not.toBe('Scenario horizon reached');
        expect(maxRisk).toBeGreaterThan(0.75);
        expect(new Set(states.map((state) => state.collapseRisk.toFixed(2))).size).toBeGreaterThan(4);
      });
  });
});
