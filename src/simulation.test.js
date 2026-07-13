import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RANKS,
  SCHEME_KINDS,
  benchmarkResults,
  calculateCommissionDue,
  calculateRankDistribution,
  cashConservationDelta,
  createInitialState,
  createRng,
  drawRecruitCount,
  levelRows,
  normalizeConfig,
  runSimulation,
  stepSimulation,
  validateConfig,
} from './simulation.js';
import { scenarios } from './scenarios.js';

describe('configuration', () => {
  it('normalizes a discriminated recruitment config', () => {
    const config = normalizeConfig({ kind: SCHEME_KINDS.RECRUITMENT });
    expect(config.kind).toBe(SCHEME_KINDS.RECRUITMENT);
    expect(config.recruitment.ranks.map((rank) => rank.name)).toEqual(['Bronze', 'Silver', 'Gold', 'Platinum']);
    expect(config.investment.depositPerRecruit).toBeGreaterThan(0);
  });

  it('normalizes a discriminated investment config', () => {
    const config = normalizeConfig({ kind: SCHEME_KINDS.INVESTMENT, investment: { promisedReturnRate: 0.2 } });
    expect(config.kind).toBe(SCHEME_KINDS.INVESTMENT);
    expect(config.investment.promisedReturnRate).toBe(0.2);
  });

  it('applies safe fallbacks to malformed optional values', () => {
    const config = normalizeConfig({
      seed: 'not-a-number',
      recruitment: {
        commissionRules: [{ trigger: 'not-a-trigger' }],
        ranks: [{}],
      },
    });
    expect(config.seed).toBe(42);
    expect(config.recruitment.commissionRules[0]).toMatchObject({ id: 'commission-1', trigger: 'enrollment' });
    expect(config.recruitment.ranks[0]).toMatchObject({ id: 'rank-1', name: 'Rank 1' });
  });

  it('rejects commission totals above 100% for one trigger', () => {
    expect(() =>
      normalizeConfig({
        recruitment: {
          commissionRules: [
            { trigger: 'enrollment', rate: 0.7 },
            { trigger: 'enrollment', rate: 0.5 },
          ],
        },
      }),
    ).toThrow(/cannot exceed 100%/);
  });

  it('rejects ranks whose requirements decrease', () => {
    expect(() =>
      normalizeConfig({
        recruitment: {
          ranks: [
            { id: 'base', directRecruits: 3, activeDownline: 20, teamVolume: 100 },
            { id: 'top', directRecruits: 2, activeDownline: 10, teamVolume: 50 },
          ],
        },
      }),
    ).toThrow(/rank requirements/);
  });

  it('accepts the normalized default configuration', () => {
    expect(validateConfig(normalizeConfig())).toBe(true);
  });
});

describe('recruitment and compensation', () => {
  it('draws a stable mean around the recruitment target', () => {
    const rng = createRng(123);
    const samples = Array.from({ length: 10_000 }, () => drawRecruitCount(4, rng));
    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    expect(mean).toBeGreaterThan(3.9);
    expect(mean).toBeLessThan(4.1);
  });

  it('draws no recruits when the target is zero', () => {
    expect(drawRecruitCount(0, () => 0.5)).toBe(0);
  });

  it('allocates every active participant to exactly one rank', () => {
    const distribution = calculateRankDistribution(10_000, 4, DEFAULT_RANKS, 100);
    expect(Object.values(distribution).reduce((sum, value) => sum + value, 0)).toBe(10_000);
    expect(distribution.bronze).toBeGreaterThan(distribution.platinum);
  });

  it('respects commission triggers and rank eligibility', () => {
    const amount = calculateCommissionDue(
      { enrollment: 10_000, 'participant-purchase': 2_000, 'retail-sale': 500 },
      [{ id: 'direct', trigger: 'enrollment', rate: 0.2, minRank: 'silver' }],
      DEFAULT_RANKS,
      { bronze: 50, silver: 30, gold: 15, platinum: 5 },
      100,
    );
    expect(amount).toBeGreaterThan(900);
    expect(amount).toBeLessThan(1_200);
  });

  it('pays no commission when no participant meets the minimum rank', () => {
    expect(calculateCommissionDue(
      { enrollment: 10_000 },
      [{ id: 'top', trigger: 'enrollment', rate: 0.5, minRank: 'platinum' }],
      DEFAULT_RANKS,
      { bronze: 100, silver: 0, gold: 0, platinum: 0 },
      100,
    )).toBe(0);
  });

  it('treats omitted rank buckets as zero during commission weighting', () => {
    expect(calculateCommissionDue(
      { enrollment: 1_000 },
      [{ id: 'all', trigger: 'enrollment', rate: 0.1, minRank: 'bronze' }],
      DEFAULT_RANKS,
      { bronze: 100 },
      100,
    )).toBe(100);
  });

  it('falls back safely for an unknown rule rank and trigger', () => {
    expect(calculateCommissionDue(
      {},
      [{ id: 'unknown', trigger: 'missing', rate: 0.5, minRank: 'missing' }],
      DEFAULT_RANKS,
      { bronze: 1 },
      1,
    )).toBe(0);
    expect(calculateRankDistribution(3, 0, [], 0)).toEqual({ bronze: 3 });
  });
});

describe('simulation ledger', () => {
  it('creates the initial state without confusing fictitious balances and cash', () => {
    const state = createInitialState({
      kind: SCHEME_KINDS.INVESTMENT,
      initialReserve: 1_000,
      initialTotalInflow: 5_000,
      initialClaimedAccountValue: 20_000,
    });
    expect(state.reserves).toBe(1_000);
    expect(state.totalInflow).toBe(5_000);
    expect(state.claimedAccountValue).toBe(20_000);
  });

  it('conserves cash in every recruitment period', () => {
    const states = runSimulation({ kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 15, seed: 7 });
    states.slice(1).forEach((state, index) => {
      expect(Math.abs(cashConservationDelta(states[index], state))).toBeLessThan(0.001);
    });
  });

  it('conserves cash in every investment period', () => {
    const states = runSimulation({ kind: SCHEME_KINDS.INVESTMENT, maxPeriods: 15, seed: 11 });
    states.slice(1).forEach((state, index) => {
      expect(Math.abs(cashConservationDelta(states[index], state))).toBeLessThan(0.001);
    });
  });

  it('tracks money moved upward separately from total inflow', () => {
    const final = runSimulation({ kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 8, seed: 9 }).at(-1);
    expect(final.moneyMovedToTop).toBe(final.ledger.operatorTake + final.ledger.commissionsPaid);
    expect(final.moneyMovedToTop).toBeLessThanOrEqual(final.totalInflow + final.config.initialReserve);
  });

  it('safely adds a partially populated prior ledger', () => {
    const initial = createInitialState({ maxPeriods: 2 });
    initial.ledger = {};
    const next = stepSimulation(initial, createRng(4));
    expect(next.ledger.participantPayments).toBeGreaterThanOrEqual(0);
    expect(next.ledger.genuineRevenue).toBe(0);
  });

  it('records participant losses and top-tier outcomes', () => {
    const final = runSimulation({ kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 6, seed: 13 }).at(-1);
    expect(final.participantsWithNetLoss).toBeGreaterThanOrEqual(0);
    expect(final.participantsWithNetLoss).toBeLessThanOrEqual(final.totalJoined);
    expect(final.profitableTopTierParticipants).toBeGreaterThanOrEqual(0);
  });

  it('is reproducible for a fixed seed', () => {
    const config = { kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 12, seed: 991 };
    const first = runSimulation(config).map(({ totalJoined, reserves, collapseRisk }) => ({ totalJoined, reserves, collapseRisk }));
    const second = runSimulation(config).map(({ totalJoined, reserves, collapseRisk }) => ({ totalJoined, reserves, collapseRisk }));
    expect(first).toEqual(second);
  });

  it('changes trajectory with a different seed', () => {
    const first = runSimulation({ kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 8, seed: 1 }).at(-1);
    const second = runSimulation({ kind: SCHEME_KINDS.RECRUITMENT, maxPeriods: 8, seed: 2 }).at(-1);
    expect(first.totalJoined).not.toBe(second.totalJoined);
  });

  it('ends immediately when a scheduled intervention freezes the scheme', () => {
    const states = runSimulation({
      kind: SCHEME_KINDS.INVESTMENT,
      maxPeriods: 12,
      shocks: [{ period: 3, freeze: true, label: 'Authorities freeze the accounts.' }],
    });
    expect(states.at(-1).period).toBe(3);
    expect(states.at(-1).endReason).toBe('Regulatory intervention');
  });

  it('combines simultaneous shocks and ignores a label-only event', () => {
    const labelOnly = runSimulation({ maxPeriods: 1, shocks: [{ period: 1, label: 'Background news.' }] }).at(-1);
    expect(labelOnly.events[0]).not.toBe('Background news.');

    const combined = runSimulation({
      maxPeriods: 3,
      shocks: [
        { period: 1, label: 'Recruitment slows.', recruitmentMultiplier: 0.5 },
        { period: 1, label: 'Accounts are frozen.', freeze: true },
      ],
    }).at(-1);
    expect(combined.endReason).toBe('Regulatory intervention');
    expect(combined.collapseCause).toBe('Recruitment slows. Accounts are frozen.');
  });

  it('ends when the finite recruitment pool is exhausted', () => {
    const final = runSimulation({
      kind: SCHEME_KINDS.RECRUITMENT,
      maxPeriods: 10,
      initialParticipants: 1,
      addressablePopulation: 2,
      growth: { recruitsPerParticipant: 4, churnRate: 0, recruitmentDecay: 1 },
    }).at(-1);
    expect(final.endReason).toBe('Recruitment pool exhausted');
  });

  it('ends when every active participant leaves', () => {
    const final = runSimulation({
      kind: SCHEME_KINDS.RECRUITMENT,
      maxPeriods: 10,
      initialParticipants: 5,
      growth: { recruitsPerParticipant: 0, churnRate: 1, recruitmentDecay: 1, churnSensitivity: 0 },
    }).at(-1);
    expect(final.endReason).toBe('Participation collapse');
    expect(final.activeParticipants).toBe(0);
  });

  it('ends when cash can no longer cover accumulated claims', () => {
    const final = runSimulation({
      kind: SCHEME_KINDS.INVESTMENT,
      maxPeriods: 20,
      initialParticipants: 1,
      initialReserve: 0,
      initialClaimedAccountValue: 1_000_000_000,
      growth: { recruitsPerParticipant: 0, churnRate: 0, recruitmentDecay: 1 },
      investment: {
        depositPerRecruit: 1_000,
        recurringDeposit: 0,
        promisedReturnRate: 0.1,
        withdrawalRate: 0.95,
        genuineRevenueRate: 0,
        operatorSkimRate: 0,
      },
    }).at(-1);
    expect(final.endReason).toBe('Liquidity collapse');
    expect(final.ledger.unpaidLiabilities).toBeGreaterThan(1_000_000_000);
  });

  it('does not step an ended simulation twice', () => {
    const final = runSimulation({ maxPeriods: 1 }).at(-1);
    expect(stepSimulation(final, createRng(1))).toBe(final);
  });
});

describe('cohorts and historical calibration', () => {
  it('tracks cohort counts and cumulative population', () => {
    const rows = levelRows({ levels: [1, 3, 9, 27] });
    expect(rows.at(-1)).toEqual({ level: 3, count: 27, cumulative: 40 });
  });

  it('loads two sandbox modes and six source-backed replays', () => {
    expect(scenarios.filter((scenario) => scenario.mode === 'interactive')).toHaveLength(2);
    expect(scenarios.filter((scenario) => scenario.mode === 'historical')).toHaveLength(6);
  });

  it('keeps every historical replay within its declared benchmark ranges', () => {
    scenarios
      .filter((scenario) => scenario.mode === 'historical')
      .forEach((scenario) => {
        const final = runSimulation(scenario).at(-1);
        const results = benchmarkResults(final.config, final);
        expect(results, scenario.id).not.toHaveLength(0);
        expect(results.every((result) => result.passed), scenario.id).toBe(true);
        expect(final.endReason).toBe('Regulatory intervention');
      });
  });

  it('keeps Stanford at the documented billions scale instead of synthetic trillions', () => {
    const scenario = scenarios.find((item) => item.id === 'stanford');
    const final = runSimulation(scenario).at(-1);
    expect(final.totalInflow).toBeGreaterThanOrEqual(7_000_000_000);
    expect(final.totalInflow).toBeLessThan(8_000_000_000);
    expect(final.totalJoined).toBeLessThan(50_000);
  });

  it('marks an unresolved benchmark path as outside its range', () => {
    const final = runSimulation({ maxPeriods: 1 }).at(-1);
    expect(benchmarkResults({ benchmarks: [{ id: 'missing', path: 'does.not.exist', min: 1, max: 2 }] }, final)[0]).toMatchObject({
      actual: undefined,
      passed: false,
    });
  });
});
