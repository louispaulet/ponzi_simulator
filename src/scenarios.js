export const scenarios = [
  {
    id: 'custom',
    name: 'Sandbox',
    mode: 'interactive',
    summary: 'Tune the two main parameters and watch the model fail under its own promises.',
    monthlyContribution: 500,
    targetRecruitsPerPerson: 3,
    promisedReturnMonthly: 0.18,
    withdrawalRate: 0.08,
    churnSensitivity: 0.33,
    initialReserve: 2_500,
    maxMonths: 72,
    seed: 42,
    recruitmentDecay: 0.97,
  },
  {
    id: 'charles-ponzi',
    name: 'Charles Ponzi, 1920',
    mode: 'watch',
    summary:
      'A fast-growth postal coupon story promising spectacular short-term gains until recruitment could not keep pace.',
    monthlyContribution: 1_000,
    targetRecruitsPerPerson: 4.2,
    promisedReturnMonthly: 0.5,
    withdrawalRate: 0.11,
    churnSensitivity: 0.42,
    initialReserve: 8_000,
    maxMonths: 14,
    seed: 1920,
    recruitmentDecay: 0.82,
  },
  {
    id: 'madoff',
    name: 'Bernard Madoff',
    mode: 'watch',
    summary:
      'A slower investment-fund style fraud with steady reported returns, stressed by a wave of withdrawals.',
    monthlyContribution: 10_000,
    targetRecruitsPerPerson: 1.35,
    promisedReturnMonthly: 0.01,
    withdrawalRate: 0.05,
    churnSensitivity: 0.22,
    initialReserve: 1_000_000,
    maxMonths: 90,
    seed: 2008,
    recruitmentDecay: 0.94,
  },
  {
    id: 'stanford',
    name: 'Allen Stanford CDs',
    mode: 'watch',
    summary:
      'A bank-certificate wrapper where reassuring paperwork masks impossible obligations to investors.',
    monthlyContribution: 7_500,
    targetRecruitsPerPerson: 1.8,
    promisedReturnMonthly: 0.025,
    withdrawalRate: 0.065,
    churnSensitivity: 0.28,
    initialReserve: 250_000,
    maxMonths: 64,
    seed: 2009,
    recruitmentDecay: 0.91,
  },
];

export function scenarioById(id) {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}
