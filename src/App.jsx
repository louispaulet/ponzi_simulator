import { useEffect, useMemo, useRef, useState } from 'react';
import PonziGame from './PonziGame.jsx';
import {
  createInitialState,
  createRng,
  levelRows,
  normalizeConfig,
  stepSimulation,
} from './simulation.js';
import { scenarioById, scenarios } from './scenarios.js';

export default function App() {
  const [scenarioId, setScenarioId] = useState('custom');
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [targetRecruitsPerPerson, setTargetRecruitsPerPerson] = useState(3);
  const [state, setState] = useState(() => createInitialState(scenarios[0]));
  const [running, setRunning] = useState(false);
  const rngRef = useRef(createRng(scenarios[0].seed));

  const scenario = scenarioById(scenarioId);
  const config = useMemo(
    () =>
      normalizeConfig({
        ...scenario,
        monthlyContribution:
          scenario.mode === 'interactive' ? monthlyContribution : scenario.monthlyContribution,
        targetRecruitsPerPerson:
          scenario.mode === 'interactive' ? targetRecruitsPerPerson : scenario.targetRecruitsPerPerson,
      }),
    [monthlyContribution, scenario, targetRecruitsPerPerson],
  );

  function reset(nextScenario = scenario, nextConfig = config) {
    rngRef.current = createRng(nextConfig.seed);
    setState(createInitialState(nextConfig));
    setRunning(nextScenario.mode === 'watch');
  }

  useEffect(() => {
    reset(scenario, config);
  }, [scenarioId]);

  useEffect(() => {
    if (scenario.mode === 'interactive') {
      reset(scenario, config);
    }
  }, [monthlyContribution, targetRecruitsPerPerson]);

  useEffect(() => {
    if (!running || state.ended) return undefined;
    const timer = window.setInterval(() => {
      setState((current) => stepSimulation(current, rngRef.current));
    }, scenario.mode === 'watch' ? 900 : 700);
    return () => window.clearInterval(timer);
  }, [running, scenario.mode, state.ended]);

  const rows = levelRows(state);
  const latestEvent = state.endReason ?? state.events[0];
  const riskPercent = Math.round(state.collapseRisk * 100);
  const riskTone = riskToneFor(state.collapseRisk);
  const totalCash = Math.max(state.totalInflow, 1);
  const payoutShare = Math.min(100, Math.round((state.totalPaidOut / totalCash) * 100));
  const reserveShare = Math.min(100, Math.round((state.reserves / totalCash) * 100));
  const liabilityShare = Math.min(100, Math.round((state.unpaidLiabilities / totalCash) * 100));

  return (
    <main className="min-h-screen bg-[#f4f1ea] text-[#171717]">
      <section className="border-b border-black bg-[#fbfaf6]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[1fr_auto] lg:px-6">
          <div className="max-w-4xl">
            <div className="mb-3 inline-flex border border-black bg-[#f3d46b] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]">
              Educational failure model
            </div>
            <h1 className="text-4xl font-black leading-none text-black sm:text-5xl">Ponzi Simulator</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#4f4a43] sm:text-base">
              Watch new cash prop up old promises until recruitment, reserves, or confidence snaps.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[420px]">
            <Metric label="Month" value={state.month} tone="paper" />
            <Metric label="Active" value={compact(state.activePopulation)} tone="blue" />
            <Metric label="Joined" value={compact(state.totalJoined)} tone="green" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[300px_minmax(0,1fr)_320px] lg:px-6">
        <aside className="space-y-4 lg:order-1">
          <Panel title="Scenario" kicker={scenario.mode === 'watch' ? 'Historical' : 'Interactive'}>
            <select
              className="w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold outline-none transition focus:bg-[#fff8d8]"
              value={scenarioId}
              onChange={(event) => setScenarioId(event.target.value)}
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-5 text-[#575047]">{scenario.summary}</p>
          </Panel>

          <Panel title="Parameters">
            <Slider
              disabled={scenario.mode === 'watch'}
              label="Monthly contribution"
              min={50}
              max={2000}
              step={50}
              value={monthlyContribution}
              display={`$${monthlyContribution.toLocaleString()}`}
              onChange={setMonthlyContribution}
            />
            <Slider
              disabled={scenario.mode === 'watch'}
              label="Target recruits per person"
              min={0.5}
              max={7}
              step={0.1}
              value={targetRecruitsPerPerson}
              display={targetRecruitsPerPerson.toFixed(1)}
              onChange={setTargetRecruitsPerPerson}
            />
            {scenario.mode === 'watch' ? (
              <p className="mt-3 border-l-4 border-[#c98219] bg-[#fff3ca] px-3 py-2 text-xs font-semibold text-[#5d3b05]">
                Historical scenarios are simplified scale models, not forensic accounting records.
              </p>
            ) : null}
          </Panel>

          <div className="grid grid-cols-3 gap-2" aria-label="Simulation controls">
            <button
              className="control-button bg-black text-white disabled:bg-[#9a948a]"
              disabled={state.ended}
              onClick={() => setRunning((value) => !value)}
            >
              {running ? 'Pause' : 'Run'}
            </button>
            <button
              className="control-button bg-[#2864c9] text-white disabled:bg-[#9a948a]"
              disabled={state.ended}
              onClick={() => setState((current) => stepSimulation(current, rngRef.current))}
            >
              Step
            </button>
            <button className="control-button border-2 border-black bg-white text-black" onClick={() => reset()}>
              Reset
            </button>
          </div>
        </aside>

        <section className="overflow-hidden border-2 border-black bg-[#0d1117] shadow-[6px_6px_0_#171717] lg:order-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black bg-[#fbfaf6] px-4 py-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-black">Flow Map</h2>
              <p className="mt-1 text-xs font-semibold text-[#675f52]">{latestEvent}</p>
            </div>
            <div className={`risk-pill ${riskTone.className}`}>Risk {riskPercent}%</div>
          </div>
          <PonziGame snapshot={state} />
        </section>

        <aside className="space-y-4 lg:order-3">
          <Panel title="Live Solvency" kicker={state.ended ? 'Ended' : running ? 'Running' : 'Paused'}>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Inflow" value={`$${compact(state.totalInflow)}`} tone="green" />
              <Metric label="Paid out" value={`$${compact(state.totalPaidOut)}`} tone="blue" />
              <Metric label="Reserves" value={`$${compact(state.reserves)}`} tone="paper" />
              <Metric label="Unpaid" value={`$${compact(state.unpaidLiabilities)}`} danger={state.unpaidLiabilities > 0} />
              <Metric label="Claimed" value={`$${compact(state.claimedAccountValue)}`} tone="gold" />
              <Metric label="Distress" value={`${state.distressMonths} mo`} danger={state.distressMonths >= 4} />
            </div>
            <div className="mt-4 overflow-hidden border-2 border-black bg-white">
              <div
                className={`h-4 ${riskTone.barClassName}`}
                style={{ width: `${riskPercent}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#625a4d]">
              <CashBar label="Paid" value={payoutShare} className="bg-[#2864c9]" />
              <CashBar label="Reserve" value={reserveShare} className="bg-[#15906b]" />
              <CashBar label="Unpaid" value={liabilityShare} className="bg-[#d63d2e]" />
            </div>
          </Panel>

          <Panel title="Levels" kicker={`${rows.length} cohorts`}>
            <div className="max-h-[330px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#fbfaf6] text-[#696154]">
                  <tr>
                    <th className="py-2">Level</th>
                    <th className="py-2 text-right">Population</th>
                    <th className="py-2 text-right">At or above</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.level} className="border-t border-[#ded7c8]">
                      <td className="py-2 font-semibold">L{row.level}</td>
                      <td className="py-2 text-right">{row.count.toLocaleString()}</td>
                      <td className="py-2 text-right">{row.cumulative.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Panel({ title, kicker, children }) {
  return (
    <section className="border-2 border-black bg-[#fbfaf6] p-4 shadow-[4px_4px_0_#171717]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-black uppercase tracking-[0.16em] text-black">{title}</h2>
        {kicker ? <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8b3f2b]">{kicker}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, danger = false, tone = 'paper' }) {
  const toneClass = danger ? 'border-[#d63d2e] bg-[#ffe1da] text-[#9f2118]' : metricToneClass(tone);
  return (
    <div className={`min-w-0 border-2 p-3 ${toneClass}`}>
      <div className="truncate text-[10px] font-black uppercase tracking-[0.16em] opacity-75">{label}</div>
      <div className="mt-1 truncate text-xl font-black leading-none">{value}</div>
    </div>
  );
}

function Slider({ label, value, display, min, max, step, disabled, onChange }) {
  return (
    <label className={`mt-4 block ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-center justify-between text-sm font-bold">
        {label}
        <span className="text-[#2864c9]">{display}</span>
      </span>
      <input
        className="mt-2 w-full accent-[#2864c9]"
        disabled={disabled}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function CashBar({ label, value, className }) {
  return (
    <div>
      <div className="mb-1 flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 border border-black bg-white">
        <div className={`h-full ${className}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function riskToneFor(value) {
  if (value > 0.7) {
    return { className: 'bg-[#d63d2e] text-white', barClassName: 'bg-[#d63d2e]' };
  }
  if (value > 0.38) {
    return { className: 'bg-[#f3d46b] text-black', barClassName: 'bg-[#c98219]' };
  }
  return { className: 'bg-[#15906b] text-white', barClassName: 'bg-[#15906b]' };
}

function metricToneClass(tone) {
  const tones = {
    paper: 'border-black bg-white text-black',
    blue: 'border-black bg-[#dce9ff] text-[#123a7a]',
    green: 'border-black bg-[#dbf5ea] text-[#0f604c]',
    gold: 'border-black bg-[#fff1b8] text-[#5d3b05]',
  };
  return tones[tone] ?? tones.paper;
}

function compact(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
