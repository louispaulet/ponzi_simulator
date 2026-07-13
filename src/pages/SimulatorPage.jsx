import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CashAllocation, EventTimeline, OutcomeChart, RankDistribution, RecruitmentTree } from '../components/Charts.jsx';
import { PageMeta } from '../components/Layout.jsx';
import { caseById } from '../data/cases.js';
import { compact, currency, integer, percent } from '../format.js';
import { defaultScenarioForKind, editableCopy, scenarioById, scenarios } from '../scenarios.js';
import {
  SCHEME_KINDS,
  benchmarkResults,
  createInitialState,
  createRng,
  normalizeConfig,
  stepSimulation,
} from '../simulation.js';

const speedOptions = [
  { value: 1, label: '1×', delay: 850 },
  { value: 2, label: '2×', delay: 420 },
  { value: 4, label: '4×', delay: 190 },
];

export default function SimulatorPage() {
  const [params, setParams] = useSearchParams();
  const initialScenario = scenarioById(params.get('scenario'));
  const [scenarioId, setScenarioId] = useState(initialScenario.id);
  const [config, setConfig] = useState(() => normalizeConfig(initialScenario));
  const [history, setHistory] = useState(() => [createInitialState(initialScenario)]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [mobileView, setMobileView] = useState('setup');
  const [validationError, setValidationError] = useState('');
  const [isWhatIf, setIsWhatIf] = useState(false);
  const rngRef = useRef(createRng(initialScenario.seed));

  const snapshot = history[currentIndex] ?? history.at(-1);
  const latest = history.at(-1);
  const historicalCase = config.historicalCaseId ? caseById(config.historicalCaseId) : null;
  const isImmutable = config.immutable && !isWhatIf;
  const selectedSpeed = speedOptions.find((option) => option.value === speed) ?? speedOptions[0];
  const benchmarks = benchmarkResults(config, latest);

  useEffect(() => {
    const requested = params.get('scenario');
    if (requested && requested !== scenarioId && scenarios.some((scenario) => scenario.id === requested)) {
      loadScenario(requested, false);
    }
  }, [params]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(() => {
      setHistory((currentHistory) => {
        const current = currentHistory.at(-1);
        if (current.ended) {
          setRunning(false);
          return currentHistory;
        }
        const next = stepSimulation(current, rngRef.current);
        setCurrentIndex(currentHistory.length);
        return [...currentHistory, next];
      });
    }, selectedSpeed.delay);
    return () => window.clearInterval(timer);
  }, [running, selectedSpeed.delay]);

  useEffect(() => {
    if (latest.ended) setRunning(false);
  }, [latest.ended]);

  function loadScenario(id, updateUrl = true) {
    const scenario = scenarioById(id);
    const nextConfig = normalizeConfig(scenario);
    setScenarioId(scenario.id);
    setConfig(nextConfig);
    setIsWhatIf(false);
    setValidationError('');
    resetSimulation(nextConfig);
    setMobileView('setup');
    if (updateUrl) setParams({ scenario: scenario.id }, { replace: true });
  }

  function resetSimulation(nextConfig = config) {
    try {
      const normalized = normalizeConfig(nextConfig);
      rngRef.current = createRng(normalized.seed);
      setHistory([createInitialState(normalized)]);
      setCurrentIndex(0);
      setRunning(false);
      setValidationError('');
    } catch (error) {
      setValidationError(error.message);
      setRunning(false);
    }
  }

  function updateConfig(path, value) {
    if (isImmutable) return;
    const next = structuredClone(config);
    setAtPath(next, path, value);
    setConfig(next);
    resetSimulation(next);
  }

  function updateCollection(collection, index, field, value) {
    if (isImmutable) return;
    const next = structuredClone(config);
    next.recruitment[collection][index][field] = value;
    setConfig(next);
    resetSimulation(next);
  }

  function addCommissionRule() {
    const next = structuredClone(config);
    next.recruitment.commissionRules.push({
      id: `rule-${next.recruitment.commissionRules.length + 1}`,
      trigger: 'enrollment',
      depth: 1,
      rate: 0.05,
      minRank: next.recruitment.ranks[0].id,
    });
    setConfig(next);
    resetSimulation(next);
  }

  function removeCommissionRule(index) {
    const next = structuredClone(config);
    next.recruitment.commissionRules.splice(index, 1);
    setConfig(next);
    resetSimulation(next);
  }

  function addRank() {
    const next = structuredClone(config);
    const previous = next.recruitment.ranks.at(-1);
    next.recruitment.ranks.push({
      id: `tier-${next.recruitment.ranks.length + 1}`,
      name: `Tier ${next.recruitment.ranks.length + 1}`,
      directRecruits: previous.directRecruits + 2,
      activeDownline: Math.max(previous.activeDownline + 1, previous.activeDownline * 3),
      teamVolume: Math.max(previous.teamVolume + 1_000, previous.teamVolume * 3),
      commissionMultiplier: previous.commissionMultiplier + 0.1,
      bonus: previous.bonus * 2 || 100,
    });
    setConfig(next);
    resetSimulation(next);
  }

  function removeRank(index) {
    if (index === 0) return;
    const next = structuredClone(config);
    const [removed] = next.recruitment.ranks.splice(index, 1);
    next.recruitment.commissionRules.forEach((rule) => {
      if (rule.minRank === removed.id) rule.minRank = next.recruitment.ranks.at(-1).id;
    });
    setConfig(next);
    resetSimulation(next);
  }

  function addShock() {
    const next = structuredClone(config);
    next.shocks.push({
      period: Math.min(config.maxPeriods, 12),
      label: 'A public warning slows recruitment and increases exits.',
      recruitmentMultiplier: 0.5,
      withdrawalMultiplier: config.kind === SCHEME_KINDS.INVESTMENT ? 3 : 1,
      churnAdd: 0.1,
      freeze: false,
    });
    setConfig(next);
    resetSimulation(next);
  }

  function updateShock(index, field, value) {
    const next = structuredClone(config);
    next.shocks[index][field] = value;
    setConfig(next);
    resetSimulation(next);
  }

  function removeShock(index) {
    const next = structuredClone(config);
    next.shocks.splice(index, 1);
    setConfig(next);
    resetSimulation(next);
  }

  function makeWhatIfCopy() {
    const next = editableCopy(config);
    setConfig(next);
    setIsWhatIf(true);
    resetSimulation(next);
  }

  function advanceOne() {
    if (currentIndex < history.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    if (latest.ended || validationError) return;
    const next = stepSimulation(latest, rngRef.current);
    setHistory((items) => [...items, next]);
    setCurrentIndex(history.length);
    setMobileView('results');
  }

  function toggleRunning() {
    if (currentIndex < history.length - 1) setCurrentIndex(history.length - 1);
    setRunning((value) => !value);
    setMobileView('results');
  }

  const statusMessage = snapshot.ended
    ? `${snapshot.endReason}. ${snapshot.collapseCause}`
    : `Period ${snapshot.period}. Collapse risk ${Math.round(snapshot.collapseRisk * 100)} percent. ${snapshot.events[0]}`;

  return (
    <>
      <PageMeta title="Simulator" description="Configure an investment Ponzi or recruitment pyramid and follow participants, cash, ranks, and liabilities through collapse." canonicalPath="/simulator" />
      <div className="simulator-page">
        <header className="simulator-header container">
          <div><p className="eyebrow">Deterministic educational model</p><h1>Scheme pressure lab</h1><p>Change one assumption at a time. Historical facts stay fixed; model outputs respond to your configuration.</p></div>
          <div className="mode-switch" role="group" aria-label="Scheme type">
            <button type="button" className={config.kind === SCHEME_KINDS.INVESTMENT ? 'is-active' : ''} onClick={() => loadScenario(defaultScenarioForKind[SCHEME_KINDS.INVESTMENT])}>Investment Ponzi</button>
            <button type="button" className={config.kind === SCHEME_KINDS.RECRUITMENT ? 'is-active' : ''} onClick={() => loadScenario(defaultScenarioForKind[SCHEME_KINDS.RECRUITMENT])}>Pyramid / MLM</button>
          </div>
        </header>

        <div className="mobile-view-switch container" role="tablist" aria-label="Simulator view">
          <button role="tab" aria-selected={mobileView === 'setup'} className={mobileView === 'setup' ? 'is-active' : ''} onClick={() => setMobileView('setup')}>Setup</button>
          <button role="tab" aria-selected={mobileView === 'results'} className={mobileView === 'results' ? 'is-active' : ''} onClick={() => setMobileView('results')}>Results <span>{snapshot.period}</span></button>
        </div>

        <div className="container simulator-layout">
          <aside className={`config-rail ${mobileView === 'setup' ? 'mobile-active' : ''}`}>
            <section className="config-card">
              <div className="config-card-heading"><div><p className="step-label">01</p><h2>Choose a baseline</h2></div><span className={`status-badge ${isImmutable ? '' : 'status-badge--editable'}`}>{isImmutable ? 'Sourced' : 'Editable'}</span></div>
              <label className="field-label" htmlFor="scenario-select">Scenario</label>
              <select id="scenario-select" value={scenarioId} onChange={(event) => loadScenario(event.target.value)}>
                <optgroup label="Sandboxes">{scenarios.filter((item) => item.mode === 'interactive').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
                <optgroup label="Historical replays">{scenarios.filter((item) => item.mode === 'historical').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</optgroup>
              </select>
              <p className="field-help">{config.description}</p>
              {historicalCase ? (
                <div className="historical-banner">
                  <strong>{isWhatIf ? 'What-if copy' : 'Immutable historical baseline'}</strong>
                  <p>{historicalCase.summary}</p>
                  <div><Link to={`/cases/${historicalCase.id}`}>Read sourced case</Link>{isImmutable ? <button type="button" onClick={makeWhatIfCopy}>Make a copy</button> : null}</div>
                </div>
              ) : null}
            </section>

            <section className="config-card">
              <div className="config-card-heading"><div><p className="step-label">02</p><h2>Set the pressure</h2></div><span>Quick setup</span></div>
              <NumberField label="Recruits per active participant" help="Average target before decay, churn, and market saturation." value={config.growth.recruitsPerParticipant} min={0} max={6} step={0.1} disabled={isImmutable} onChange={(value) => updateConfig('growth.recruitsPerParticipant', value)} slider />
              <NumberField label="Addressable participant pool" help="The finite audience this hypothetical scheme can reach." value={config.addressablePopulation} min={config.initialParticipants} max={10_000_000_000} step={1_000} disabled={isImmutable} onChange={(value) => updateConfig('addressablePopulation', value)} />
              {config.kind === SCHEME_KINDS.INVESTMENT ? (
                <>
                  <NumberField label="Deposit per new participant" value={config.investment.depositPerRecruit} min={0} max={5_000_000} step={100} prefix="$" disabled={isImmutable} onChange={(value) => updateConfig('investment.depositPerRecruit', value)} />
                  <PercentField label="Promised return per period" value={config.investment.promisedReturnRate} max={100} disabled={isImmutable} onChange={(value) => updateConfig('investment.promisedReturnRate', value)} />
                  <PercentField label="Baseline withdrawal rate" value={config.investment.withdrawalRate} max={90} disabled={isImmutable} onChange={(value) => updateConfig('investment.withdrawalRate', value)} />
                </>
              ) : (
                <>
                  <NumberField label="Joining fee" value={config.recruitment.joinFee} min={0} max={50_000} step={25} prefix="$" disabled={isImmutable} onChange={(value) => updateConfig('recruitment.joinFee', value)} />
                  <NumberField label="Recurring participant purchase" help="Required or incentivized purchase per active participant and period." value={config.recruitment.recurringPurchase} min={0} max={10_000} step={10} prefix="$" disabled={isImmutable} onChange={(value) => updateConfig('recruitment.recurringPurchase', value)} />
                  <NumberField label="Retail sales per participant" help="Sales to customers outside the modeled participant network." value={config.recruitment.retailSalesPerParticipant} min={0} max={10_000} step={10} prefix="$" disabled={isImmutable} onChange={(value) => updateConfig('recruitment.retailSalesPerParticipant', value)} />
                </>
              )}
            </section>

            <details className="config-card advanced-card">
              <summary><span><span className="step-label">03</span><strong>Advanced rules</strong></span><span>Commissions, ranks, shocks</span></summary>
              <div className="advanced-content">
                <div className="advanced-section"><h3>Growth and cash</h3>
                  <PercentField label="Recruitment retained each period" value={config.growth.recruitmentDecay} disabled={isImmutable} onChange={(value) => updateConfig('growth.recruitmentDecay', value)} />
                  <PercentField label="Baseline churn" value={config.growth.churnRate} disabled={isImmutable} onChange={(value) => updateConfig('growth.churnRate', value)} />
                  {config.kind === SCHEME_KINDS.INVESTMENT ? (
                    <><NumberField label="Recurring deposit" value={config.investment.recurringDeposit} min={0} max={1_000_000} step={100} prefix="$" disabled={isImmutable} onChange={(value) => updateConfig('investment.recurringDeposit', value)} /><PercentField label="Genuine revenue on reserves" value={config.investment.genuineRevenueRate} disabled={isImmutable} onChange={(value) => updateConfig('investment.genuineRevenueRate', value)} /><PercentField label="Operator diversion" value={config.investment.operatorSkimRate} disabled={isImmutable} onChange={(value) => updateConfig('investment.operatorSkimRate', value)} /></>
                  ) : (
                    <><PercentField label="Retail margin" value={config.recruitment.retailMargin} disabled={isImmutable} onChange={(value) => updateConfig('recruitment.retailMargin', value)} /><PercentField label="Refund rate on churn" value={config.recruitment.refundRate} disabled={isImmutable} onChange={(value) => updateConfig('recruitment.refundRate', value)} /><PercentField label="Product / operating cost" value={config.recruitment.productCostRate} disabled={isImmutable} onChange={(value) => updateConfig('recruitment.productCostRate', value)} /><PercentField label="Operator diversion" value={config.recruitment.operatorSkimRate} disabled={isImmutable} onChange={(value) => updateConfig('recruitment.operatorSkimRate', value)} /></>
                  )}
                </div>
                {config.kind === SCHEME_KINDS.RECRUITMENT ? (
                  <>
                    <div className="advanced-section"><div className="advanced-heading"><div><h3>Upline commissions</h3><p>Rates are applied to each trigger and filtered by rank eligibility.</p></div>{!isImmutable ? <button type="button" onClick={addCommissionRule}>Add rule</button> : null}</div>
                      <div className="rule-list">{config.recruitment.commissionRules.map((rule, index) => (
                        <div className="rule-card" key={rule.id}>
                          <label>Trigger<select disabled={isImmutable} value={rule.trigger} onChange={(event) => updateCollection('commissionRules', index, 'trigger', event.target.value)}><option value="enrollment">Enrollment</option><option value="participant-purchase">Participant purchase</option><option value="retail-sale">Retail sale</option></select></label>
                          <label>Depth<input disabled={isImmutable} type="number" min="1" max="12" value={rule.depth} onChange={(event) => updateCollection('commissionRules', index, 'depth', Number(event.target.value))} /></label>
                          <label>Rate<input disabled={isImmutable} type="number" min="0" max="100" step="1" value={Math.round(rule.rate * 1000) / 10} onChange={(event) => updateCollection('commissionRules', index, 'rate', Number(event.target.value) / 100)} /><span>%</span></label>
                          <label>Minimum rank<select disabled={isImmutable} value={rule.minRank} onChange={(event) => updateCollection('commissionRules', index, 'minRank', event.target.value)}>{config.recruitment.ranks.map((rank) => <option key={rank.id} value={rank.id}>{rank.name}</option>)}</select></label>
                          {!isImmutable ? <button className="remove-button" type="button" onClick={() => removeCommissionRule(index)}>Remove</button> : null}
                        </div>
                      ))}</div>
                    </div>
                    <div className="advanced-section"><div className="advanced-heading"><div><h3>Award tiers</h3><p>Requirements must increase from one tier to the next.</p></div>{!isImmutable ? <button type="button" onClick={addRank}>Add tier</button> : null}</div>
                      <div className="rank-editor-list">{config.recruitment.ranks.map((rank, index) => (
                        <div className="rank-editor" key={rank.id}>
                          <label>Tier name<input disabled={isImmutable} value={rank.name} onChange={(event) => updateCollection('ranks', index, 'name', event.target.value)} /></label>
                          <label>Direct recruits<input disabled={isImmutable} type="number" min="0" value={rank.directRecruits} onChange={(event) => updateCollection('ranks', index, 'directRecruits', Number(event.target.value))} /></label>
                          <label>Active downline<input disabled={isImmutable} type="number" min="0" value={rank.activeDownline} onChange={(event) => updateCollection('ranks', index, 'activeDownline', Number(event.target.value))} /></label>
                          <label>Team volume<input disabled={isImmutable} type="number" min="0" step="100" value={rank.teamVolume} onChange={(event) => updateCollection('ranks', index, 'teamVolume', Number(event.target.value))} /></label>
                          <label>Multiplier<input disabled={isImmutable} type="number" min="1" max="5" step="0.05" value={rank.commissionMultiplier} onChange={(event) => updateCollection('ranks', index, 'commissionMultiplier', Number(event.target.value))} /></label>
                          <label>Bonus<input disabled={isImmutable} type="number" min="0" step="50" value={rank.bonus} onChange={(event) => updateCollection('ranks', index, 'bonus', Number(event.target.value))} /></label>
                          {!isImmutable && index > 0 ? <button className="remove-button" type="button" onClick={() => removeRank(index)}>Remove tier</button> : null}
                        </div>
                      ))}</div>
                    </div>
                  </>
                ) : null}
                <div className="advanced-section"><div className="advanced-heading"><div><h3>External shocks</h3><p>Model press scrutiny, redemptions, warnings, or an intervention.</p></div>{!isImmutable ? <button type="button" onClick={addShock}>Add shock</button> : null}</div>
                  <div className="shock-list">{config.shocks.length === 0 ? <p className="empty-note">No external shocks configured.</p> : config.shocks.map((shock, index) => (
                    <div className="shock-card" key={`${shock.period}-${index}`}>
                      <label>Period<input disabled={isImmutable} type="number" min="1" max={config.maxPeriods} value={shock.period} onChange={(event) => updateShock(index, 'period', Number(event.target.value))} /></label>
                      <label>Recruiting multiplier<input disabled={isImmutable} type="number" min="0" max="2" step="0.1" value={shock.recruitmentMultiplier} onChange={(event) => updateShock(index, 'recruitmentMultiplier', Number(event.target.value))} /></label>
                      {config.kind === SCHEME_KINDS.INVESTMENT ? <label>Withdrawal multiplier<input disabled={isImmutable} type="number" min="0" max="50" step="0.5" value={shock.withdrawalMultiplier} onChange={(event) => updateShock(index, 'withdrawalMultiplier', Number(event.target.value))} /></label> : null}
                      <label className="shock-label">Event label<input disabled={isImmutable} value={shock.label} onChange={(event) => updateShock(index, 'label', event.target.value)} /></label>
                      <label className="checkbox-field"><input disabled={isImmutable} type="checkbox" checked={shock.freeze} onChange={(event) => updateShock(index, 'freeze', event.target.checked)} />Ends the replay</label>
                      {!isImmutable ? <button className="remove-button" type="button" onClick={() => removeShock(index)}>Remove</button> : null}
                    </div>
                  ))}</div>
                </div>
              </div>
            </details>
            {validationError ? <div className="validation-message" role="alert"><strong>Check the configuration</strong><p>{validationError}</p></div> : null}
          </aside>

          <section className={`results-workspace ${mobileView === 'results' ? 'mobile-active' : ''}`} aria-label="Simulation results">
            <div className="simulation-summary">
              <div className="summary-status"><span className={`status-dot ${running ? 'is-running' : snapshot.ended ? 'is-ended' : ''}`} />{snapshot.ended ? 'Ended' : running ? 'Running' : currentIndex < history.length - 1 ? 'Reviewing' : 'Paused'}</div>
              <div className="summary-grid">
                <SummaryMetric label="Period" value={`${snapshot.period}/${config.maxPeriods}`} />
                <SummaryMetric label="People joined" value={compact(snapshot.totalJoined)} help={`${integer(snapshot.totalJoined)} modeled participants`} />
                <SummaryMetric label="Money in" value={currency(snapshot.totalInflow)} />
                <SummaryMetric label="Moved upward" value={currency(snapshot.moneyMovedToTop)} tone="danger" />
                <SummaryMetric label="Unpaid" value={currency(snapshot.ledger.unpaidLiabilities)} tone={snapshot.ledger.unpaidLiabilities > 0 ? 'danger' : ''} />
                <SummaryMetric label="Collapse risk" value={percent(snapshot.collapseRisk)} tone={snapshot.collapseRisk > 0.7 ? 'danger' : snapshot.collapseRisk > 0.35 ? 'warning' : 'safe'} />
              </div>
              <div className="risk-progress" role="progressbar" aria-label="Collapse risk" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(snapshot.collapseRisk * 100)}><span style={{ width: `${snapshot.collapseRisk * 100}%` }} /></div>
            </div>

            {snapshot.ended ? (
              <section className="collapse-card" aria-labelledby="collapse-heading">
                <div><p className="eyebrow">Replay ended in period {snapshot.period}</p><h2 id="collapse-heading">{snapshot.endReason}</h2><p>{snapshot.collapseCause}</p></div>
                <dl><div><dt>Participants at modeled net loss</dt><dd>{integer(snapshot.participantsWithNetLoss)}</dd></div><div><dt>Money moved upward</dt><dd>{currency(snapshot.moneyMovedToTop)}</dd></div><div><dt>Unpaid liabilities</dt><dd>{currency(snapshot.ledger.unpaidLiabilities)}</dd></div></dl>
              </section>
            ) : null}

            <div className="results-grid">
              <RecruitmentTree history={history} currentIndex={currentIndex} />
              <CashAllocation snapshot={snapshot} />
              <OutcomeChart snapshot={snapshot} />
              {config.kind === SCHEME_KINDS.RECRUITMENT ? <RankDistribution snapshot={snapshot} /> : (
                <section className="data-card balance-card" aria-labelledby="balance-heading"><div className="card-heading-row"><div><p className="card-kicker">Cash vs. claims</p><h2 id="balance-heading">Reported value is not reserves</h2></div></div><div className="balance-comparison"><div><span>Claimed account value</span><strong>{currency(snapshot.claimedAccountValue)}</strong></div><div><span>Actual cash reserves</span><strong>{currency(snapshot.reserves)}</strong></div></div><p className="fine-print">The gap is an educational estimate of the mismatch between statements and available cash.</p></section>
              )}
              <EventTimeline snapshot={snapshot} />
              {historicalCase ? (
                <section className="data-card benchmark-card" aria-labelledby="benchmark-heading"><div className="card-heading-row"><div><p className="card-kicker">Historical calibration</p><h2 id="benchmark-heading">Facts and model stay separate</h2></div><Link to={`/cases/${historicalCase.id}`}>Open case</Link></div><ul>{benchmarks.map((benchmark) => <li key={benchmark.id}><span className={benchmark.passed ? 'benchmark-pass' : 'benchmark-pending'}>{benchmark.passed ? 'Within range' : snapshot.ended ? 'Outside range' : 'In progress'}</span><div><strong>{benchmark.label}</strong><small>Current model: {typeof benchmark.actual === 'number' ? compact(benchmark.actual) : String(benchmark.actual)}</small></div></li>)}</ul><p className="fine-print">Benchmarks check the replay window and scale. They do not turn the model into forensic accounting.</p></section>
              ) : null}
            </div>
          </section>
        </div>

        <div className="playback-dock" aria-label="Simulation playback controls">
          <div className="container playback-inner">
            <button className="play-button" type="button" disabled={latest.ended || Boolean(validationError)} onClick={toggleRunning}>{running ? 'Pause' : latest.period === 0 ? 'Run model' : 'Resume'}</button>
            <button className="step-button" type="button" disabled={latest.ended || Boolean(validationError)} onClick={advanceOne}>Step</button>
            <button className="reset-button" type="button" onClick={() => resetSimulation()}>Reset</button>
            <label className="speed-control"><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>{speedOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="timeline-control"><span>Review period {currentIndex}</span><input type="range" min="0" max={Math.max(0, history.length - 1)} value={currentIndex} onChange={(event) => { setRunning(false); setCurrentIndex(Number(event.target.value)); }} /></label>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">{statusMessage}</p>
      </div>
    </>
  );
}

function NumberField({ label, help, value, min, max, step, prefix, suffix, disabled, onChange, slider = false }) {
  const id = `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="number-field">
      <label htmlFor={id}>{label}</label>
      <div className="number-input-wrap">{prefix ? <span>{prefix}</span> : null}<input id={id} type="number" value={value} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} />{suffix ? <span>{suffix}</span> : null}</div>
      {slider ? <input className="range-input" aria-label={`${label} slider`} type="range" value={value} min={min} max={max} step={step} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} /> : null}
      {help ? <p>{help}</p> : null}
    </div>
  );
}

function PercentField({ label, value, max = 100, disabled, onChange }) {
  return <NumberField label={label} value={Math.round(value * 10_000) / 100} min={0} max={max} step={0.5} suffix="%" disabled={disabled} onChange={(next) => onChange(next / 100)} />;
}

function SummaryMetric({ label, value, help, tone = '' }) {
  return <div className={`summary-metric ${tone ? `summary-metric--${tone}` : ''}`} title={help}><span>{label}</span><strong>{value}</strong></div>;
}

function setAtPath(object, path, value) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((current, part) => current[part], object);
  target[last] = value;
}
