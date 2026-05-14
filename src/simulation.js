export const DEFAULT_LIMITS = {
  worldPopulation: 8_100_000_000,
  globalMoneyCap: 450_000_000_000_000,
  maxLevels: 16,
};

export function createRng(seed = 1) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawRecruitCount(target, rng = Math.random, spread = 0.55) {
  if (target <= 0) return 0;
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const count = Math.round(target + normal * Math.max(0.6, target * spread));
  return Math.max(0, count);
}

export function createInitialState(config = {}) {
  const merged = normalizeConfig(config);
  const levels = merged.initialLevels.length > 0 ? [...merged.initialLevels] : [merged.initialParticipants];
  const activeLevels =
    merged.initialActiveLevels.length > 0 ? [...merged.initialActiveLevels] : [levels[levels.length - 1] ?? 1];
  const totalJoined = levels.reduce((sum, count) => sum + count, 0);
  const activePopulation = activeLevels.reduce((sum, count) => sum + count, 0);
  return {
    config: merged,
    month: 0,
    levels,
    activeLevels,
    totalJoined,
    activePopulation,
    reserves: merged.initialReserve,
    totalInflow: merged.initialTotalInflow,
    totalPaidOut: 0,
    claimedAccountValue: merged.initialClaimedAccountValue,
    unpaidLiabilities: 0,
    stress: 0,
    distressMonths: 0,
    recruitingMomentum: 1,
    collapseRisk: 0,
    lastNewParticipants: 0,
    ended: false,
    endReason: null,
    events: ['The promoter starts with one apparent success story.'],
  };
}

export function normalizeConfig(config = {}) {
  return {
    id: config.id ?? 'custom',
    name: config.name ?? 'Custom Scheme',
    monthlyContribution: Number(config.monthlyContribution ?? 500),
    targetRecruitsPerPerson: Number(config.targetRecruitsPerPerson ?? 3),
    promisedReturnMonthly: Number(config.promisedReturnMonthly ?? 0.18),
    withdrawalRate: Number(config.withdrawalRate ?? 0.08),
    churnSensitivity: Number(config.churnSensitivity ?? 0.3),
    initialReserve: Number(config.initialReserve ?? 0),
    initialParticipants: Number(config.initialParticipants ?? 1),
    initialLevels: Array.isArray(config.initialLevels) ? config.initialLevels.map(Number) : [],
    initialActiveLevels: Array.isArray(config.initialActiveLevels) ? config.initialActiveLevels.map(Number) : [],
    initialTotalInflow: Number(config.initialTotalInflow ?? 0),
    initialClaimedAccountValue: Number(
      config.initialClaimedAccountValue ?? config.initialReserve ?? config.initialTotalInflow ?? 0,
    ),
    maxMonths: Number(config.maxMonths ?? 84),
    seed: Number(config.seed ?? 7),
    recruitmentDecay: Number(config.recruitmentDecay ?? 0.97),
    saturationMultiplier: Number(config.saturationMultiplier ?? 9),
    worldPopulation: Number(config.worldPopulation ?? DEFAULT_LIMITS.worldPopulation),
    globalMoneyCap: Number(config.globalMoneyCap ?? DEFAULT_LIMITS.globalMoneyCap),
    maxLevels: Number(config.maxLevels ?? DEFAULT_LIMITS.maxLevels),
  };
}

export function stepSimulation(previous, rng = Math.random) {
  if (previous.ended) return previous;

  const config = previous.config;
  const month = previous.month + 1;
  const activeLevels = [...previous.activeLevels];
  const levels = [...previous.levels];
  const activePopulation = activeLevels.reduce((sum, count) => sum + count, 0);
  const marketSaturation = Math.min(1, previous.totalJoined / config.worldPopulation);
  const fatigue = Math.pow(config.recruitmentDecay, month - 1);
  const stressPenalty = Math.max(0.08, 1 - previous.stress * config.churnSensitivity);
  const effectiveTarget =
    config.targetRecruitsPerPerson * fatigue * stressPenalty * (1 - marketSaturation);

  let newParticipants = 0;
  activeLevels.forEach((count) => {
    const cohorts = Math.min(count, 600);
    const scale = count / cohorts;
    for (let i = 0; i < cohorts; i += 1) {
      newParticipants += Math.round(drawRecruitCount(effectiveTarget, rng) * scale);
    }
  });

  const maxAvailable = Math.max(0, config.worldPopulation - previous.totalJoined);
  newParticipants = Math.min(newParticipants, maxAvailable);

  const recruitingMomentum =
    previous.lastNewParticipants > 0 ? newParticipants / previous.lastNewParticipants : newParticipants > 0 ? 1 : 0;
  const growthSlowdown = previous.month > 2 ? Math.max(0, 1 - recruitingMomentum) : 0;
  const saturationPressure = Math.min(1, Math.pow(marketSaturation * config.saturationMultiplier, 1.35));
  const confidencePressure = Math.min(1, previous.stress + growthSlowdown * 0.55 + saturationPressure * 0.35);
  const requestedWithdrawalRate = Math.min(
    0.88,
    config.withdrawalRate * (1 + confidencePressure * 6 + previous.distressMonths * 0.2),
  );
  const statedValueBeforeWithdrawals =
    previous.claimedAccountValue * (1 + config.promisedReturnMonthly) + newParticipants * config.monthlyContribution;
  const promisedPayout =
    previous.claimedAccountValue * config.promisedReturnMonthly * (0.25 + confidencePressure * 0.75);
  const withdrawals = statedValueBeforeWithdrawals * requestedWithdrawalRate;
  const inflow = newParticipants * config.monthlyContribution;
  const due = promisedPayout + withdrawals;
  const available = previous.reserves + inflow;
  const paidOut = Math.min(available, due);
  const shortfall = Math.max(0, due - available);
  const reserves = Math.max(0, available - due);
  const claimedAccountValue = Math.max(0, statedValueBeforeWithdrawals - paidOut);
  const cashCoverage = available / Math.max(due, 1);
  const distressSignal =
    shortfall > 0 ||
    growthSlowdown > 0.35 ||
    saturationPressure > 0.2 ||
    cashCoverage < 1.15 ||
    requestedWithdrawalRate > config.withdrawalRate * 2.2;
  const distressMonths = distressSignal ? previous.distressMonths + 1 : Math.max(0, previous.distressMonths - 1);
  const stress = Math.min(
    1,
    previous.stress * 0.58 +
      shortfall / Math.max(due, 1) * 0.72 +
      growthSlowdown * 0.28 +
      saturationPressure * 0.22 +
      distressMonths * 0.045,
  );
  const liabilityPressure = Math.min(1, claimedAccountValue / Math.max(previous.totalInflow + inflow + reserves, 1));
  const collapseRisk = Math.min(
    1,
    stress * 0.62 +
      liabilityPressure * 0.18 +
      growthSlowdown * 0.22 +
      saturationPressure * 0.22 +
      distressMonths * 0.055 +
      shortfall / Math.max(claimedAccountValue, config.monthlyContribution * 700, 1),
  );
  const churnRate = Math.min(0.72, stress * config.churnSensitivity + shortfall / Math.max(due, 1) * 0.35);
  const retainedActiveLevels = activeLevels.map((count) => Math.max(0, Math.floor(count * (1 - churnRate))));

  if (newParticipants > 0) {
    retainedActiveLevels.push(newParticipants);
    levels.push(newParticipants);
  }

  while (retainedActiveLevels.length > config.maxLevels) {
    retainedActiveLevels.shift();
  }

  const next = {
    ...previous,
    month,
    levels,
    activeLevels: retainedActiveLevels,
    totalJoined: previous.totalJoined + newParticipants,
    activePopulation: retainedActiveLevels.reduce((sum, count) => sum + count, 0),
    reserves,
    totalInflow: previous.totalInflow + inflow,
    totalPaidOut: previous.totalPaidOut + paidOut,
    claimedAccountValue,
    unpaidLiabilities: previous.unpaidLiabilities + shortfall,
    stress,
    distressMonths,
    recruitingMomentum,
    collapseRisk,
    lastNewParticipants: newParticipants,
    events: buildEvents(previous, {
      month,
      newParticipants,
      shortfall,
      stress,
      churnRate,
      growthSlowdown,
      requestedWithdrawalRate,
      inflow,
      due,
    }),
  };

  return applyEndConditions(next);
}

export function levelRows(state) {
  let cumulative = 0;
  return state.levels.map((count, level) => {
    cumulative += count;
    return {
      level,
      count,
      cumulative,
    };
  });
}

export function runSimulation(config, months = 24) {
  const rng = createRng(normalizeConfig(config).seed);
  const states = [createInitialState(config)];
  for (let i = 0; i < months; i += 1) {
    const next = stepSimulation(states.at(-1), rng);
    states.push(next);
    if (next.ended) break;
  }
  return states;
}

function applyEndConditions(state) {
  const { config } = state;
  if (state.totalJoined >= config.worldPopulation) {
    return end(state, 'World population saturation', 'The model has recruited the available world population.');
  }
  if (
    state.activePopulation *
      config.monthlyContribution *
      config.promisedReturnMonthly *
      (1 + state.stress) >=
    config.globalMoneyCap
  ) {
    return end(state, 'Not enough money in the world', 'Promised payouts exceed the modeled global money cap.');
  }
  if (state.unpaidLiabilities > config.monthlyContribution * 100_000 && state.stress > 0.85) {
    return end(state, 'Operator flees', 'Unpaid liabilities are large enough that the promoter disappears.');
  }
  if (state.month > 1 && state.activePopulation === 0 && state.unpaidLiabilities > 0) {
    return end(state, 'Scheme collapse', 'Every active participant has left while unpaid obligations remain.');
  }
  if (state.month > 3 && state.collapseRisk > 0.92 && state.unpaidLiabilities > 0) {
    return end(state, 'Scheme collapse', 'The cash shortfall becomes visible and redemption requests overwhelm inflows.');
  }
  if (state.month > 5 && state.distressMonths >= 5 && state.collapseRisk > 0.78) {
    return end(state, 'Scheme collapse', 'Recruiting can no longer cover promised payouts, triggering exits.');
  }
  if (state.month >= config.maxMonths) {
    return end(state, 'Scenario horizon reached', 'The scenario ended before the scheme fully collapsed.');
  }
  return state;
}

function end(state, reason, detail) {
  return {
    ...state,
    ended: true,
    endReason: reason,
    events: [detail, ...state.events].slice(0, 6),
  };
}

function buildEvents(previous, metrics) {
  const events = [];
  if (metrics.newParticipants > previous.lastNewParticipants * 1.5 && metrics.newParticipants > 10) {
    events.push('Recruiting surges as early payouts create false confidence.');
  }
  if (metrics.shortfall > 0) {
    events.push('Incoming cash fails to cover promised withdrawals and returns.');
  }
  if (metrics.stress > 0.6) {
    events.push('Participant confidence breaks and withdrawals accelerate.');
  }
  if (metrics.churnRate > 0.25) {
    events.push('Large cohorts leave after missed or delayed payouts.');
  }
  if (metrics.growthSlowdown > 0.35) {
    events.push('Recruiting momentum slows and confidence starts to crack.');
  }
  if (metrics.requestedWithdrawalRate > previous.config.withdrawalRate * 2.2) {
    events.push('More participants try to cash out instead of rolling balances forward.');
  }
  if (metrics.inflow > metrics.due && metrics.newParticipants > 0) {
    events.push('New money temporarily hides the insolvency.');
  }
  return [...events, ...previous.events].slice(0, 6);
}
