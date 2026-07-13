export const sources = {
  archivesPonzi: {
    organization: 'U.S. National Archives',
    title: 'When Ponzi’s Bubble Burst',
    url: 'https://www.archives.gov/publications/prologue/2010/summer/ponzi-inmate-case-file',
  },
  dojMadoff: {
    organization: 'U.S. Department of Justice',
    title: 'Department of Justice Compensates Victims of Bernard Madoff Fraud Scheme',
    url: 'https://www.justice.gov/archives/opa/pr/department-justice-compensates-victims-bernard-madoff-fraud-scheme-funds-recovered-through',
  },
  madoffTrustee: {
    organization: 'SIPA Trustee for BLMIS',
    title: 'Madoff Recovery Initiative — Claims Status',
    url: 'https://www.madofftrustee.com/claims-03.html',
  },
  dojStanford: {
    organization: 'U.S. Department of Justice',
    title: 'Allen Stanford Sentenced for Orchestrating $7 Billion Investment Fraud Scheme',
    url: 'https://www.justice.gov/archives/opa/pr/allen-stanford-sentenced-110-years-prison-orchestrating-7-billion-investment-fraud-scheme',
  },
  secZeek: {
    organization: 'U.S. Securities and Exchange Commission',
    title: 'SEC Shuts Down $600 Million Online Pyramid and Ponzi Scheme',
    url: 'https://www.sec.gov/newsroom/press-releases/2012-2012-160htm',
  },
  secForsage: {
    organization: 'U.S. Securities and Exchange Commission',
    title: 'SEC Charges Eleven Individuals in $300 Million Crypto Pyramid Scheme',
    url: 'https://www.sec.gov/newsroom/press-releases/2022-134',
  },
  ftcBurnLounge: {
    organization: 'U.S. Federal Trade Commission',
    title: 'Court Order Shuts Down BurnLounge Pyramid Scam',
    url: 'https://www.ftc.gov/news-events/news/press-releases/2012/03/ftc-action-leads-court-order-shutting-down-pyramid-scamthousands-consumers-burned-burnlounge',
  },
  ftcMlm: {
    organization: 'U.S. Federal Trade Commission',
    title: 'Multi-Level Marketing Businesses and Pyramid Schemes',
    url: 'https://consumer.ftc.gov/articles/multi-level-marketing-businesses-and-pyramid-schemes',
  },
  blsCpi: {
    organization: 'U.S. Bureau of Labor Statistics',
    title: 'Consumer Price Index',
    url: 'https://www.bls.gov/cpi/',
  },
};

function metric(value, display, qualifier, sourceIds, extra = {}) {
  return { value, display, qualifier, sourceIds, ...extra };
}

export const cases = [
  {
    id: 'charles-ponzi',
    name: 'Charles Ponzi',
    shortName: 'Ponzi, 1920',
    schemeType: 'investment-ponzi',
    typeLabel: 'Investment Ponzi',
    legalStatus: 'Convicted',
    start: { value: '1919-12', label: 'Late 1919', precision: 'approximate' },
    end: { value: '1920-08', label: 'August 1920', precision: 'month' },
    durationMonths: 8,
    inflationFactor2024: 15.68,
    affectedPeople: metric(null, 'Thousands', 'The source does not give an exact participant count.', ['archivesPonzi']),
    grossRaised: metric(15_000_000, '$15 million', 'Roughly taken in over eight months.', ['archivesPonzi']),
    verifiedNetLoss: metric(null, 'Not established', 'Gross receipts are documented; a comparable net-loss figure is not.', ['archivesPonzi']),
    moneyToTop: metric(null, 'Not established', 'The source documents the payment mechanism, not an operator-take total.', ['archivesPonzi']),
    recovered: metric(null, 'Not established', 'No comparable recovery figure is provided by this source.', ['archivesPonzi']),
    fictitiousBalance: metric(null, 'Not applicable', 'The fraud promised short-term returns rather than reporting a documented aggregate account balance.', ['archivesPonzi']),
    replayId: 'charles-ponzi',
    summary: 'The postal-reply-coupon story that gave the fraud its modern name.',
    narrative:
      'Ponzi promised 50% interest in 90 days. Early investors were paid with later investors’ money, and the operation took in roughly $15 million before confidence broke in 1920.',
    facts: [
      'Promised 50% interest in 90 days.',
      'Took in roughly $15 million over eight months.',
      'Collapsed after press scrutiny and a government audit exposed the mismatch.',
    ],
    sourceIds: ['archivesPonzi'],
  },
  {
    id: 'madoff',
    name: 'Bernard L. Madoff Investment Securities',
    shortName: 'Madoff',
    schemeType: 'investment-ponzi',
    typeLabel: 'Investment Ponzi',
    legalStatus: 'Guilty plea',
    start: { value: '1960', label: 'Operated for decades', precision: 'disputed' },
    end: { value: '2008-12', label: 'December 2008', precision: 'month' },
    durationMonths: null,
    inflationFactor2024: 1.46,
    affectedPeople: metric(65_000, '65,000+ petitions', 'Victim-fund petitions, including indirect victims; not direct account count.', ['dojMadoff']),
    grossRaised: metric(null, 'Not comparable', 'Cash deposited, direct accounts, feeder funds, and fictitious statements are different measures.', ['dojMadoff', 'madoffTrustee']),
    verifiedNetLoss: metric(20_315_000_000, '$20.315 billion', 'Total value of allowed net-equity claims as of July 3, 2026.', ['madoffTrustee'], { asOf: '2026-07-03' }),
    moneyToTop: metric(null, 'Not established', 'Recoveries and forfeiture judgments should not be presented as operator take.', ['dojMadoff']),
    recovered: metric(9_000_000_000, '$9+ billion', 'DOJ recoveries reported in 2017; later trustee recoveries are tracked separately.', ['dojMadoff'], { asOf: '2017-11-09' }),
    fictitiousBalance: metric(64_800_000_000, '$64.8 billion', 'Approximate balance on fabricated client statements, not cash loss.', ['madoffTrustee']),
    replayId: 'madoff',
    summary: 'A long-running investment fraud sustained by fabricated statements and selective withdrawals.',
    narrative:
      'Madoff used fabricated trading records and steady reported returns to maintain confidence. The financial crisis triggered withdrawal demands that the operation could not meet.',
    facts: [
      'The investment advisory business operated for decades; the exact start of the fraud is disputed.',
      'The court-approved net-investment method excludes fictitious paper profits.',
      'The fraud was exposed in December 2008 and Madoff pleaded guilty in March 2009.',
    ],
    sourceIds: ['dojMadoff', 'madoffTrustee'],
  },
  {
    id: 'stanford',
    name: 'Stanford International Bank',
    shortName: 'Stanford',
    schemeType: 'investment-ponzi',
    typeLabel: 'Investment Ponzi',
    legalStatus: 'Convicted',
    start: { value: '1989', label: 'Approximately 1989', precision: 'approximate' },
    end: { value: '2009-02', label: 'February 2009', precision: 'month' },
    durationMonths: 240,
    inflationFactor2024: 1.46,
    affectedPeople: metric(null, 'Not stated here', 'The cited sentencing record does not provide a comparable investor count.', ['dojStanford']),
    grossRaised: metric(7_000_000_000, '$7 billion', 'Amount described by DOJ as misappropriated through the 20-year scheme.', ['dojStanford']),
    verifiedNetLoss: metric(5_900_000_000, '$5.9 billion judgment', 'Personal money judgment, shown as a judicial measure rather than a victim-loss estimate.', ['dojStanford']),
    moneyToTop: metric(7_000_000_000, '$7 billion', 'DOJ says the funds were misappropriated to finance Stanford’s businesses.', ['dojStanford']),
    recovered: metric(330_000_000, '$330 million', 'Foreign accounts the jury found were fraud proceeds and subject to forfeiture.', ['dojStanford']),
    fictitiousBalance: metric(null, 'Not stated here', 'The cited record focuses on misappropriated CD funds.', ['dojStanford']),
    replayId: 'stanford',
    summary: 'Fraudulent certificates of deposit sold through the appearance of a conventional offshore bank.',
    narrative:
      'Stanford International Bank sold CDs while misrepresenting how depositor money was invested. A slump in new CD sales and record redemptions during the financial crisis exposed the cash pressure.',
    facts: [
      'DOJ described the operation as a 20-year, $7 billion investment fraud.',
      'The CDs typically paid a premium over U.S. bank rates.',
      'Stanford was convicted on 13 of 14 counts and sentenced to 110 years.',
    ],
    sourceIds: ['dojStanford'],
  },
  {
    id: 'zeek-rewards',
    name: 'Zeek Rewards',
    shortName: 'Zeek Rewards',
    schemeType: 'recruitment-pyramid',
    typeLabel: 'Pyramid / Ponzi hybrid',
    legalStatus: 'SEC enforcement',
    start: { value: '2011-01', label: 'January 2011', precision: 'month' },
    end: { value: '2012-08', label: 'August 2012', precision: 'month' },
    durationMonths: 20,
    inflationFactor2024: 1.37,
    affectedPeople: metric(1_000_000, '1+ million', 'Internet customers in the U.S. and overseas.', ['secZeek']),
    grossRaised: metric(600_000_000, '$600 million', 'Raised from customers before the SEC intervention.', ['secZeek']),
    verifiedNetLoss: metric(null, 'Not established', 'Cash raised, paid out, and frozen are documented separately.', ['secZeek']),
    moneyToTop: metric(null, 'Several million', 'The SEC said the operator siphoned several million; no exact figure was stated.', ['secZeek']),
    recovered: metric(225_000_000, '$225 million held', 'Investor funds held when the SEC obtained an asset freeze; not a final recovery total.', ['secZeek']),
    fictitiousBalance: metric(null, 'Not applicable', 'The program used reward points and purported profit sharing.', ['secZeek']),
    replayId: 'zeek-rewards',
    summary: 'An online rewards program combining recruitment incentives with fictitious daily profits.',
    narrative:
      'Zeek Rewards presented payouts as a share of business profit, while the SEC alleged that most revenue and payouts came from new participants. It reached more than one million customers before intervention.',
    facts: [
      'Raised approximately $600 million from more than one million customers.',
      'Paid nearly $375 million and held approximately $225 million at intervention.',
      'Customer cash payouts had almost caught up with monthly inflows by July 2012.',
    ],
    sourceIds: ['secZeek'],
  },
  {
    id: 'forsage',
    name: 'Forsage',
    shortName: 'Forsage',
    schemeType: 'recruitment-pyramid',
    typeLabel: 'Crypto pyramid / Ponzi',
    legalStatus: 'SEC allegations',
    start: { value: '2020-01', label: 'January 2020', precision: 'month' },
    end: { value: '2022-08', label: 'Charged August 2022', precision: 'enforcement-date' },
    durationMonths: 31,
    inflationFactor2024: 1.07,
    affectedPeople: metric(null, 'Millions', 'The SEC described millions of retail investors without an exact count.', ['secForsage']),
    grossRaised: metric(300_000_000, '$300+ million', 'Amount the SEC alleged was raised worldwide.', ['secForsage']),
    verifiedNetLoss: metric(null, 'Not adjudicated', 'The cited release states allegations, not a final loss determination.', ['secForsage']),
    moneyToTop: metric(null, 'Not stated', 'The cited release does not provide a comparable operator-take total.', ['secForsage']),
    recovered: metric(null, 'Not stated', 'No recovery total is given in the cited charging release.', ['secForsage']),
    fictitiousBalance: metric(null, 'Not applicable', 'The alleged scheme used smart-contract matrices rather than account statements.', ['secForsage']),
    replayId: 'forsage',
    summary: 'A smart-contract matrix promoted as decentralized while allegedly directing new money upward.',
    narrative:
      'The SEC alleged that Forsage used smart contracts across several blockchains to operate a pyramid and Ponzi structure that raised more than $300 million from millions of retail investors.',
    facts: [
      'Launched in January 2020 across Ethereum and later other blockchains.',
      'Raised more than $300 million according to the SEC’s allegations.',
      'Regulators issued cease-and-desist actions before the 2022 U.S. charges.',
    ],
    sourceIds: ['secForsage'],
  },
  {
    id: 'burnlounge',
    name: 'BurnLounge',
    shortName: 'BurnLounge',
    schemeType: 'recruitment-pyramid',
    typeLabel: 'Product-based pyramid',
    legalStatus: 'Court order',
    start: { value: '2005', label: 'Approximately 2005', precision: 'approximate' },
    end: { value: '2012-03', label: 'Final order March 2012', precision: 'court-date' },
    durationMonths: 84,
    inflationFactor2024: 1.51,
    affectedPeople: metric(56_000, '56,000+', 'Consumers lured into the program.', ['ftcBurnLounge']),
    grossRaised: metric(null, 'Not stated', 'The cited FTC release does not give total participant payments.', ['ftcBurnLounge']),
    verifiedNetLoss: metric(17_000_000, '$17 million redress', 'Court-ordered consumer redress, not necessarily total consumer loss.', ['ftcBurnLounge']),
    moneyToTop: metric(null, 'Not stated', 'The cited release describes recruitment-driven compensation but no aggregate transfer.', ['ftcBurnLounge']),
    recovered: metric(17_000_000, '$17 million ordered', 'Approximate total ordered for consumer refunds.', ['ftcBurnLounge']),
    fictitiousBalance: metric(null, 'Not applicable', 'The program sold packages and monthly subscriptions.', ['ftcBurnLounge']),
    replayId: 'burnlounge',
    summary: 'A digital-music business whose rewards depended primarily on recruiting package buyers.',
    narrative:
      'BurnLounge sold real digital-music products, but the court found that the compensation structure rewarded recruitment. More than 56,000 consumers joined before the operation was halted.',
    facts: [
      'Packages ranged from $29.95 to $429.95 plus monthly fees.',
      'More than 56,000 consumers participated.',
      'The court ordered close to $17 million for consumer redress.',
    ],
    sourceIds: ['ftcBurnLounge'],
  },
];

export function caseById(id) {
  return cases.find((item) => item.id === id) ?? null;
}

export function sourceListForCase(caseRecord) {
  return caseRecord.sourceIds.map((id) => ({ id, ...sources[id] })).filter((source) => source.url);
}

export function adjustedMetric(metricRecord, factor, adjusted) {
  if (!adjusted || metricRecord.value == null) return metricRecord.value;
  return Math.round(metricRecord.value * factor);
}

export const leaderboardFields = [
  { key: 'affectedPeople', label: 'People affected', type: 'metric' },
  { key: 'grossRaised', label: 'Money raised', type: 'metric' },
  { key: 'verifiedNetLoss', label: 'Verified harm', type: 'metric' },
  { key: 'moneyToTop', label: 'Moved upward', type: 'metric' },
  { key: 'recovered', label: 'Recovered / ordered', type: 'metric' },
  { key: 'start', label: 'Started', type: 'date' },
  { key: 'end', label: 'Ended / charged', type: 'date' },
  { key: 'durationMonths', label: 'Duration', type: 'number' },
];

export function sortCases(items, field = 'verifiedNetLoss', direction = 'desc', options = {}) {
  const multiplier = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const aValue = sortableValue(a, field, options.adjusted);
    const bValue = sortableValue(b, field, options.adjusted);
    if (aValue == null && bValue == null) return a.name.localeCompare(b.name);
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    if (typeof aValue === 'string') return aValue.localeCompare(bValue) * multiplier;
    return (aValue - bValue) * multiplier;
  });
}

function sortableValue(item, field, adjusted = false) {
  const value = item[field];
  if (value && typeof value === 'object' && 'value' in value) {
    if (adjusted && ['grossRaised', 'verifiedNetLoss', 'moneyToTop', 'recovered'].includes(field) && value.value != null) {
      return value.value * item.inflationFactor2024;
    }
    return value.value;
  }
  return value;
}
