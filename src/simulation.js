export const SCHEME_KINDS = {
  INVESTMENT: 'investment-ponzi',
  RECRUITMENT: 'recruitment-pyramid',
};

export const DEFAULT_RANKS = [
  {
    id: 'bronze',
    name: 'Bronze',
    directRecruits: 0,
    activeDownline: 0,
    teamVolume: 0,
    commissionMultiplier: 1,
    bonus: 0,
  },
  {
    id: 'silver',
    name: 'Silver',
    directRecruits: 2,
    activeDownline: 8,
    teamVolume: 5_000,
    commissionMultiplier: 1.08,
    bonus: 100,
  },
  {
    id: 'gold',
    name: 'Gold',
    directRecruits: 4,
    activeDownline: 40,
    teamVolume: 25_000,
    commissionMultiplier: 1.2,
    bonus: 500,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    directRecruits: 6,
    activeDownline: 180,
    teamVolume: 100_000,
    commissionMultiplier: 1.4,
    bonus: 2_500,
  },
];

export const DEFAULT_COMMISSION_RULES = [
  { id: 'direct-enrollment', trigger: 'enrollment', depth: 1, rate: 0.2, minRank: 'bronze' },
  { id: 'level-two', trigger: 'enrollment', depth: 2, rate: 0.08, minRank: 'silver' },
  { id: 'team-purchase', trigger: 'participant-purchase', depth: 1, rate: 0.06, minRank: 'bronze' },
  { id: 'retail-override', trigger: 'retail-sale', depth: 1, rate: 0.04, minRank: 'silver' },
];

const ZERO_LEDGER = Object.freeze({
  participantPayments: 0,
  retailRevenue: 0,
  genuineRevenue: 0,
  commissionsPaid: 0,
  withdrawalsPaid: 0,
  refundsPaid: 0,
  productCosts: 0,
  operatorTake: 0,
  unpaidLiabilities: 0,
});

export function createRng(seed = 1) {
  let value = Number(seed) >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawRecruitCount(target, rng = Math.random, spread = 0.28) {
  if (target <= 0) return 0;
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, target + normal * target * spread);
}

export function normalizeConfig(config = {}) {
  const kind = config.kind === SCHEME_KINDS.INVESTMENT ? SCHEME_KINDS.INVESTMENT : SCHEME_KINDS.RECRUITMENT;
  const normalized = {
    id: config.id ?? 'custom-recruitment',
    name: config.name ?? (kind === SCHEME_KINDS.INVESTMENT ? 'Custom investment scheme' : 'Custom recruitment scheme'),
    kind,
    description: config.description ?? '',
    historicalCaseId: config.historicalCaseId ?? null,
    immutable: Boolean(config.immutable),
    seed: number(config.seed, 42),
    maxPeriods: integer(config.maxPeriods, 60),
    initialParticipants: integer(config.initialParticipants, 1),
    addressablePopulation: integer(config.addressablePopulation, 10_000_000),
    initialReserve: number(config.initialReserve, 0),
    initialTotalInflow: number(config.initialTotalInflow, 0),
    initialClaimedAccountValue: number(config.initialClaimedAccountValue, 0),
    growth: {
      recruitsPerParticipant: number(config.growth?.recruitsPerParticipant, kind === SCHEME_KINDS.INVESTMENT ? 0.35 : 2.5),
      recruitmentDecay: number(config.growth?.recruitmentDecay, 0.96),
      churnRate: number(config.growth?.churnRate, 0.08),
      churnSensitivity: number(config.growth?.churnSensitivity, 0.35),
      marketFriction: number(config.growth?.marketFriction, 1.35),
    },
    investment: {
      depositPerRecruit: number(config.investment?.depositPerRecruit, 5_000),
      recurringDeposit: number(config.investment?.recurringDeposit, 0),
      promisedReturnRate: number(config.investment?.promisedReturnRate, 0.12),
      withdrawalRate: number(config.investment?.withdrawalRate, 0.05),
      genuineRevenueRate: number(config.investment?.genuineRevenueRate, 0),
      operatorSkimRate: number(config.investment?.operatorSkimRate, 0.08),
    },
    recruitment: {
      joinFee: number(config.recruitment?.joinFee, 500),
      recurringPurchase: number(config.recruitment?.recurringPurchase, 100),
      retailSalesPerParticipant: number(config.recruitment?.retailSalesPerParticipant, 20),
      retailMargin: number(config.recruitment?.retailMargin, 0.35),
      refundRate: number(config.recruitment?.refundRate, 0.12),
      productCostRate: number(config.recruitment?.productCostRate, 0.25),
      operatorSkimRate: number(config.recruitment?.operatorSkimRate, 0.12),
      commissionRules: (config.recruitment?.commissionRules ?? DEFAULT_COMMISSION_RULES).map(normalizeCommissionRule),
      ranks: (config.recruitment?.ranks ?? DEFAULT_RANKS).map(normalizeRank),
    },
    shocks: (config.shocks ?? []).map((shock) => ({
      period: integer(shock.period, 1),
      label: shock.label ?? 'External pressure hits the scheme.',
      recruitmentMultiplier: number(shock.recruitmentMultiplier, 1),
      withdrawalMultiplier: number(shock.withdrawalMultiplier, 1),
      churnAdd: number(shock.churnAdd, 0),
      freeze: Boolean(shock.freeze),
    })),
    benchmarks: config.benchmarks ?? [],
  };
  validateConfig(normalized);
  return normalized;
}

export function validateConfig(config) {
  const errors = [];
  const rates = [
    ['growth churn rate', config.growth.churnRate],
    ['growth churn sensitivity', config.growth.churnSensitivity],
    ['investment promised return rate', config.investment.promisedReturnRate],
    ['investment withdrawal rate', config.investment.withdrawalRate],
    ['investment genuine revenue rate', config.investment.genuineRevenueRate],
    ['investment operator skim rate', config.investment.operatorSkimRate],
    ['recruitment retail margin', config.recruitment.retailMargin],
    ['recruitment refund rate', config.recruitment.refundRate],
    ['recruitment product cost rate', config.recruitment.productCostRate],
    ['recruitment operator skim rate', config.recruitment.operatorSkimRate],
  ];
  rates.forEach(([label, value]) => {
    if (!Number.isFinite(value) || value < 0 || value > 1) errors.push(`${label} must be between 0 and 1`);
  });
  if (config.growth.recruitsPerParticipant < 0) errors.push('recruits per participant cannot be negative');
  if (config.growth.recruitmentDecay < 0 || config.growth.recruitmentDecay > 1) errors.push('recruitment decay must be between 0 and 1');
  if (config.initialParticipants < 1) errors.push('initial participants must be at least 1');
  if (config.addressablePopulation < config.initialParticipants) errors.push('addressable population must include initial participants');
  if (config.maxPeriods < 1) errors.push('the simulation needs at least one period');

  const moneyFields = [
    config.initialReserve,
    config.initialTotalInflow,
    config.initialClaimedAccountValue,
    config.investment.depositPerRecruit,
    config.investment.recurringDeposit,
    config.recruitment.joinFee,
    config.recruitment.recurringPurchase,
    config.recruitment.retailSalesPerParticipant,
  ];
  if (moneyFields.some((value) => !Number.isFinite(value) || value < 0)) errors.push('money values must be finite and non-negative');

  const commissionTotals = new Map();
  config.recruitment.commissionRules.forEach((rule) => {
    if (rule.rate < 0 || rule.rate > 1) errors.push(`commission rate for ${rule.id} must be between 0 and 1`);
    commissionTotals.set(rule.trigger, (commissionTotals.get(rule.trigger) ?? 0) + rule.rate);
  });
  commissionTotals.forEach((total, trigger) => {
    if (total > 1 + Number.EPSILON) errors.push(`${trigger} commission rates cannot exceed 100%`);
  });

  let previous = { directRecruits: -1, activeDownline: -1, teamVolume: -1 };
  config.recruitment.ranks.forEach((rank) => {
    if (rank.directRecruits < previous.directRecruits || rank.activeDownline < previous.activeDownline || rank.teamVolume < previous.teamVolume) {
      errors.push('rank requirements must be ordered from lowest to highest');
    }
    previous = rank;
  });
  if (errors.length) throw new Error(errors.join('; '));
  return true;
}

export function createInitialState(config = {}) {
  const normalized = normalizeConfig(config);
  const initialRanks = calculateRankDistribution(
    normalized.initialParticipants,
    normalized.growth.recruitsPerParticipant,
    normalized.recruitment.ranks,
    normalized.recruitment.recurringPurchase,
  );
  return {
    config: normalized,
    period: 0,
    month: 0,
    levels: [normalized.initialParticipants],
    cohorts: [{ period: 0, joined: normalized.initialParticipants, active: normalized.initialParticipants }],
    activeParticipants: normalized.initialParticipants,
    activePopulation: normalized.initialParticipants,
    totalJoined: normalized.initialParticipants,
    reserves: normalized.initialReserve,
    claimedAccountValue: normalized.initialClaimedAccountValue,
    totalInflow: normalized.initialTotalInflow,
    ledger: { ...ZERO_LEDGER, participantPayments: normalized.initialTotalInflow },
    periodLedger: { ...ZERO_LEDGER },
    rankDistribution: initialRanks,
    participantsWithNetLoss: normalized.initialParticipants,
    profitableTopTierParticipants: 0,
    moneyMovedToTop: 0,
    stress: 0,
    distressPeriods: 0,
    distressMonths: 0,
    collapseRisk: 0,
    recruitingMomentum: 1,
    lastNewParticipants: 0,
    ended: false,
    endReason: null,
    collapseCause: null,
    events: ['The first participants join and the promised rewards still look plausible.'],
  };
}

export function stepSimulation(previous, rng = Math.random) {
  if (previous.ended) return previous;
  const config = previous.config;
  const period = previous.period + 1;
  const shock = combinedShock(config.shocks.filter((item) => item.period === period));
  const marketSaturation = previous.totalJoined / config.addressablePopulation;
  const fatigue = Math.pow(config.growth.recruitmentDecay, period - 1);
  const stressPenalty = Math.max(0.04, 1 - previous.stress * config.growth.churnSensitivity);
  const marketPenalty = Math.max(0, 1 - Math.pow(Math.min(1, marketSaturation), config.growth.marketFriction));
  const target = config.growth.recruitsPerParticipant * fatigue * stressPenalty * marketPenalty * shock.recruitmentMultiplier;
  let newParticipants = Math.round(previous.activeParticipants * drawRecruitCount(target, rng));
  newParticipants = Math.min(newParticipants, Math.max(0, config.addressablePopulation - previous.totalJoined));
  const momentum = previous.lastNewParticipants > 0 ? newParticipants / previous.lastNewParticipants : newParticipants > 0 ? 1 : 0;
  const slowdown = previous.period > 1 ? Math.max(0, 1 - momentum) : 0;
  const churnRate = clamp(
    config.growth.churnRate + previous.stress * config.growth.churnSensitivity + shock.churnAdd + slowdown * 0.08,
    0,
    1,
  );
  const churned = Math.min(previous.activeParticipants, Math.floor(previous.activeParticipants * churnRate));
  const activeParticipants = Math.max(0, previous.activeParticipants - churned + newParticipants);
  const rankDistribution = calculateRankDistribution(
    activeParticipants,
    target,
    config.recruitment.ranks,
    config.recruitment.recurringPurchase,
  );

  const periodResult =
    config.kind === SCHEME_KINDS.INVESTMENT
      ? investmentPeriod(previous, { period, newParticipants, activeParticipants, churned, slowdown, shock })
      : recruitmentPeriod(previous, {
          period,
          newParticipants,
          activeParticipants,
          churned,
          slowdown,
          shock,
          rankDistribution,
        });

  const cashCoverage = periodResult.availableCash / Math.max(periodResult.totalDue, 1);
  const saturationPressure = clamp(marketSaturation * 1.5, 0, 1);
  const shortfallRatio = periodResult.shortfall / Math.max(periodResult.totalDue, 1);
  const distressSignal = shortfallRatio > 0.02 || slowdown > 0.35 || cashCoverage < 1.08 || shock.freeze;
  const distressPeriods = distressSignal ? previous.distressPeriods + 1 : Math.max(0, previous.distressPeriods - 1);
  const stress = clamp(
    previous.stress * 0.54 + shortfallRatio * 0.82 + slowdown * 0.24 + saturationPressure * 0.2 + distressPeriods * 0.045,
    0,
    1,
  );
  const liabilityRatio = periodResult.ledger.unpaidLiabilities / Math.max(periodResult.totalInflow, 1);
  const collapseRisk = clamp(
    stress * 0.55 + liabilityRatio * 0.35 + slowdown * 0.2 + saturationPressure * 0.16 + distressPeriods * 0.045,
    0,
    1,
  );

  const levels = newParticipants > 0 ? [...previous.levels, newParticipants] : [...previous.levels];
  const cohorts = previous.cohorts
    .map((cohort) => ({ ...cohort, active: Math.max(0, Math.round(cohort.active * (1 - churnRate))) }))
    .concat(newParticipants > 0 ? [{ period, joined: newParticipants, active: newParticipants }] : []);
  const averageStake = averageParticipantStake(config);
  const participantPayouts = periodResult.ledger.withdrawalsPaid + periodResult.ledger.refundsPaid + periodResult.ledger.commissionsPaid;
  const profitableParticipants = Math.min(previous.totalJoined + newParticipants, Math.floor(participantPayouts / Math.max(averageStake, 1)));
  const topTierRank = config.recruitment.ranks.at(-1)?.id;
  const profitableTopTierParticipants = config.kind === SCHEME_KINDS.RECRUITMENT ? rankDistribution[topTierRank] ?? 0 : 0;

  const next = {
    ...previous,
    period,
    month: period,
    levels,
    cohorts,
    activeParticipants,
    activePopulation: activeParticipants,
    totalJoined: previous.totalJoined + newParticipants,
    reserves: periodResult.reserves,
    claimedAccountValue: periodResult.claimedAccountValue,
    totalInflow: periodResult.totalInflow,
    ledger: periodResult.ledger,
    periodLedger: periodResult.periodLedger,
    rankDistribution,
    participantsWithNetLoss: Math.max(0, previous.totalJoined + newParticipants - profitableParticipants),
    profitableTopTierParticipants,
    moneyMovedToTop: periodResult.ledger.operatorTake + periodResult.ledger.commissionsPaid,
    stress,
    distressPeriods,
    distressMonths: distressPeriods,
    collapseRisk,
    recruitingMomentum: momentum,
    lastNewParticipants: newParticipants,
    events: buildEvents(previous, { newParticipants, churned, slowdown, shortfall: periodResult.shortfall, shock, stress }),
  };
  return applyEndConditions(next, shock);
}

function investmentPeriod(previous, context) {
  const config = previous.config;
  const terms = config.investment;
  const newDeposits = context.newParticipants * terms.depositPerRecruit;
  const recurringDeposits = previous.activeParticipants * terms.recurringDeposit;
  const participantPayments = newDeposits + recurringDeposits;
  const genuineRevenue = previous.reserves * terms.genuineRevenueRate;
  const inflow = participantPayments + genuineRevenue;
  const statedBeforeWithdrawals = previous.claimedAccountValue * (1 + terms.promisedReturnRate) + participantPayments;
  const withdrawalDemand = statedBeforeWithdrawals * clamp(
    terms.withdrawalRate * context.shock.withdrawalMultiplier * (1 + previous.stress * 4 + context.slowdown * 2),
    0,
    0.95,
  );
  const operatorDue = inflow * terms.operatorSkimRate;
  const availableCash = previous.reserves + inflow;
  const operatorTake = Math.min(availableCash, operatorDue);
  const availableForParticipants = Math.max(0, availableCash - operatorTake);
  const withdrawalsPaid = Math.min(availableForParticipants, withdrawalDemand);
  const shortfall = Math.max(0, withdrawalDemand - withdrawalsPaid);
  const reserves = Math.max(0, availableForParticipants - withdrawalsPaid);
  const periodLedger = {
    ...ZERO_LEDGER,
    participantPayments,
    genuineRevenue,
    withdrawalsPaid,
    operatorTake,
    unpaidLiabilities: shortfall,
  };
  return {
    availableCash,
    totalDue: withdrawalDemand + operatorDue,
    shortfall,
    reserves,
    claimedAccountValue: Math.max(0, statedBeforeWithdrawals - withdrawalsPaid),
    totalInflow: previous.totalInflow + participantPayments + genuineRevenue,
    periodLedger,
    ledger: addLedgers(previous.ledger, periodLedger),
  };
}

function recruitmentPeriod(previous, context) {
  const config = previous.config;
  const terms = config.recruitment;
  const enrollment = context.newParticipants * terms.joinFee;
  const purchases = previous.activeParticipants * terms.recurringPurchase;
  const participantPayments = enrollment + purchases;
  const retailRevenue = previous.activeParticipants * terms.retailSalesPerParticipant * terms.retailMargin;
  const inflow = participantPayments + retailRevenue;
  const triggerBases = {
    enrollment,
    'participant-purchase': purchases,
    'retail-sale': retailRevenue,
  };
  const commissionsDue = calculateCommissionDue(triggerBases, terms.commissionRules, terms.ranks, context.rankDistribution, context.activeParticipants);
  const priorRanks = previous.rankDistribution;
  const rankBonuses = terms.ranks.reduce((sum, rank) => {
    const promoted = Math.max(0, (context.rankDistribution[rank.id] ?? 0) - (priorRanks[rank.id] ?? 0));
    return sum + promoted * rank.bonus;
  }, 0);
  const refundsDue = context.churned * (terms.joinFee + terms.recurringPurchase) * terms.refundRate;
  const productCostsDue = (purchases + previous.activeParticipants * terms.retailSalesPerParticipant) * terms.productCostRate;
  const operatorDue = inflow * terms.operatorSkimRate;
  const availableCash = previous.reserves + inflow;
  const operatorTake = Math.min(availableCash, operatorDue);
  const distributable = Math.max(0, availableCash - operatorTake);
  const participantDue = commissionsDue + rankBonuses + refundsDue + productCostsDue;
  const paymentRatio = Math.min(1, distributable / Math.max(participantDue, 1));
  const commissionsPaid = (commissionsDue + rankBonuses) * paymentRatio;
  const refundsPaid = refundsDue * paymentRatio;
  const productCosts = productCostsDue * paymentRatio;
  const paid = commissionsPaid + refundsPaid + productCosts;
  const shortfall = Math.max(0, participantDue - paid);
  const reserves = Math.max(0, distributable - paid);
  const periodLedger = {
    ...ZERO_LEDGER,
    participantPayments,
    retailRevenue,
    commissionsPaid,
    refundsPaid,
    productCosts,
    operatorTake,
    unpaidLiabilities: shortfall,
  };
  return {
    availableCash,
    totalDue: participantDue + operatorDue,
    shortfall,
    reserves,
    claimedAccountValue: 0,
    totalInflow: previous.totalInflow + participantPayments + retailRevenue,
    periodLedger,
    ledger: addLedgers(previous.ledger, periodLedger),
  };
}

export function calculateCommissionDue(triggerBases, rules, ranks, rankDistribution, activeParticipants) {
  const rankIndex = new Map(ranks.map((rank, index) => [rank.id, index]));
  return rules.reduce((sum, rule) => {
    const minimumIndex = rankIndex.get(rule.minRank) ?? 0;
    const eligible = ranks.slice(minimumIndex).reduce((count, rank) => count + (rankDistribution[rank.id] ?? 0), 0);
    const eligibility = activeParticipants > 0 ? eligible / activeParticipants : 0;
    const multiplier = weightedRankMultiplier(ranks, rankDistribution, minimumIndex, eligible);
    return sum + (triggerBases[rule.trigger] ?? 0) * rule.rate * eligibility * multiplier;
  }, 0);
}

export function calculateRankDistribution(activeParticipants, effectiveRecruits, ranks, recurringPurchase) {
  const distribution = Object.fromEntries(ranks.map((rank) => [rank.id, 0]));
  let unassigned = Math.max(0, Math.floor(activeParticipants));
  for (let index = ranks.length - 1; index >= 1; index -= 1) {
    const rank = ranks[index];
    const directFactor = rank.directRecruits === 0 ? 1 : clamp(effectiveRecruits / rank.directRecruits, 0, 1);
    const modeledTeamSize = Math.pow(Math.max(1, effectiveRecruits + 1), index + 1);
    const downlineFactor = rank.activeDownline === 0 ? 1 : clamp(modeledTeamSize / rank.activeDownline, 0, 1);
    const modeledVolume = modeledTeamSize * recurringPurchase;
    const volumeFactor = rank.teamVolume === 0 ? 1 : clamp(modeledVolume / rank.teamVolume, 0, 1);
    const scarcity = Math.pow(0.22, index);
    const qualified = Math.min(unassigned, Math.floor(activeParticipants * scarcity * directFactor * downlineFactor * volumeFactor));
    distribution[rank.id] = qualified;
    unassigned -= qualified;
  }
  distribution[ranks[0]?.id ?? 'bronze'] = unassigned;
  return distribution;
}

export function levelRows(state) {
  let cumulative = 0;
  return state.levels.map((count, level) => {
    cumulative += count;
    return { level, count, cumulative };
  });
}

export function runSimulation(config, periods = null) {
  const normalized = normalizeConfig(config);
  const rng = createRng(normalized.seed);
  const states = [createInitialState(normalized)];
  const limit = periods ?? normalized.maxPeriods;
  for (let index = 0; index < limit; index += 1) {
    const next = stepSimulation(states.at(-1), rng);
    states.push(next);
    if (next.ended) break;
  }
  return states;
}

export function benchmarkResults(config, finalState) {
  return config.benchmarks.map((benchmark) => {
    const actual = valueAtPath(finalState, benchmark.path);
    return {
      ...benchmark,
      actual,
      passed: actual >= benchmark.min && actual <= benchmark.max,
    };
  });
}

export function cashConservationDelta(previous, next) {
  const inflow = next.periodLedger.participantPayments + next.periodLedger.retailRevenue + next.periodLedger.genuineRevenue;
  const outflow =
    next.periodLedger.commissionsPaid +
    next.periodLedger.withdrawalsPaid +
    next.periodLedger.refundsPaid +
    next.periodLedger.productCosts +
    next.periodLedger.operatorTake;
  return previous.reserves + inflow - outflow - next.reserves;
}

function applyEndConditions(state, shock) {
  if (shock.freeze) return end(state, 'Regulatory intervention', shock.label);
  if (state.totalJoined >= state.config.addressablePopulation) {
    return end(state, 'Recruitment pool exhausted', 'The model has reached the addressable participant pool.');
  }
  if (state.period > 2 && state.activeParticipants === 0) {
    return end(state, 'Participation collapse', 'No active participants remain to bring in money or recruits.');
  }
  if (state.period > 3 && state.collapseRisk >= 0.94 && state.ledger.unpaidLiabilities > averageParticipantStake(state.config) * 100) {
    return end(state, 'Liquidity collapse', 'Cash on hand can no longer cover participant claims and promised rewards.');
  }
  if (state.period > 5 && state.distressPeriods >= 5 && state.collapseRisk >= 0.78) {
    return end(state, 'Confidence collapse', 'Recruitment and confidence deteriorate faster than the scheme can recover.');
  }
  if (state.period >= state.config.maxPeriods) {
    return end(state, 'Model horizon reached', 'The configured educational replay has reached its final period.');
  }
  return state;
}

function end(state, reason, detail) {
  return {
    ...state,
    ended: true,
    endReason: reason,
    collapseCause: detail,
    events: [detail, ...state.events].slice(0, 8),
  };
}

function buildEvents(previous, metrics) {
  const events = [];
  if (metrics.shock.label && (metrics.shock.freeze || metrics.shock.recruitmentMultiplier !== 1 || metrics.shock.withdrawalMultiplier !== 1)) {
    events.push(metrics.shock.label);
  }
  if (metrics.newParticipants > Math.max(10, previous.lastNewParticipants * 1.35)) events.push('Recruiting accelerates as visible payouts create confidence.');
  if (metrics.slowdown > 0.35) events.push('Recruitment momentum weakens and the required growth becomes harder to sustain.');
  if (metrics.churned > previous.activeParticipants * 0.25) events.push('A large share of active participants leaves during this period.');
  if (metrics.shortfall > 0) events.push('Available cash fails to cover participant claims and operating promises.');
  if (metrics.stress > 0.65) events.push('Confidence is breaking and cash demands are accelerating.');
  return [...events, ...previous.events].slice(0, 8);
}

function combinedShock(shocks) {
  return shocks.reduce(
    (combined, shock) => ({
      label: combined.label ? `${combined.label} ${shock.label}` : shock.label,
      recruitmentMultiplier: combined.recruitmentMultiplier * shock.recruitmentMultiplier,
      withdrawalMultiplier: combined.withdrawalMultiplier * shock.withdrawalMultiplier,
      churnAdd: combined.churnAdd + shock.churnAdd,
      freeze: combined.freeze || shock.freeze,
    }),
    { label: '', recruitmentMultiplier: 1, withdrawalMultiplier: 1, churnAdd: 0, freeze: false },
  );
}

function weightedRankMultiplier(ranks, distribution, minimumIndex, eligible) {
  if (eligible === 0) return 1;
  return ranks.slice(minimumIndex).reduce((sum, rank) => sum + (distribution[rank.id] ?? 0) * rank.commissionMultiplier, 0) / eligible;
}

function averageParticipantStake(config) {
  if (config.kind === SCHEME_KINDS.INVESTMENT) return config.investment.depositPerRecruit + config.investment.recurringDeposit;
  return config.recruitment.joinFee + config.recruitment.recurringPurchase * Math.min(config.maxPeriods, 6);
}

function addLedgers(a, b) {
  return Object.fromEntries(Object.keys(ZERO_LEDGER).map((key) => [key, (a[key] ?? 0) + (b[key] ?? 0)]));
}

function normalizeCommissionRule(rule, index) {
  return {
    id: rule.id ?? `commission-${index + 1}`,
    trigger: ['enrollment', 'participant-purchase', 'retail-sale'].includes(rule.trigger) ? rule.trigger : 'enrollment',
    depth: integer(rule.depth, 1),
    rate: number(rule.rate, 0),
    minRank: rule.minRank ?? 'bronze',
  };
}

function normalizeRank(rank, index) {
  return {
    id: rank.id ?? `rank-${index + 1}`,
    name: rank.name ?? `Rank ${index + 1}`,
    directRecruits: integer(rank.directRecruits, 0),
    activeDownline: integer(rank.activeDownline, 0),
    teamVolume: number(rank.teamVolume, 0),
    commissionMultiplier: number(rank.commissionMultiplier, 1),
    bonus: number(rank.bonus, 0),
  };
}

function valueAtPath(value, path) {
  return path.split('.').reduce((current, segment) => current?.[segment], value);
}

function number(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function integer(value, fallback) {
  return Math.max(0, Math.round(number(value, fallback)));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
