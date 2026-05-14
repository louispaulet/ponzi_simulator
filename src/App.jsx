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

  const rows = levelRows(state).slice(-8);
  const latestEvent = state.endReason ?? state.events[0];

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 lg:grid-cols-[1fr_auto] lg:px-6">
          <div>
            <h1 className="text-3xl font-black tracking-normal text-slate-950">Ponzi Simulator</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              An educational model of recruitment-driven fraud: early payouts look convincing because new
              money is diverted upward, then the math runs out of people, cash, or confidence.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <Metric label="Month" value={state.month} />
            <Metric label="Active" value={compact(state.activePopulation)} />
            <Metric label="Joined" value={compact(state.totalJoined)} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[320px_1fr_330px] lg:px-6">
        <aside className="space-y-4">
          <Panel title="Scenario">
            <select
              className="w-full border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={scenarioId}
              onChange={(event) => setScenarioId(event.target.value)}
            >
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-3 text-sm leading-5 text-slate-600">{scenario.summary}</p>
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
              <p className="mt-3 border-l-4 border-amber-500 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Historical scenarios are watch-only so the preset assumptions stay intact.
              </p>
            ) : null}
          </Panel>

          <div className="grid grid-cols-3 gap-2">
            <button
              className="bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-400"
              disabled={state.ended}
              onClick={() => setRunning((value) => !value)}
            >
              {running ? 'Pause' : 'Run'}
            </button>
            <button
              className="bg-sky-600 px-3 py-2 text-sm font-bold text-white disabled:bg-slate-400"
              disabled={state.ended}
              onClick={() => setState((current) => stepSimulation(current, rngRef.current))}
            >
              Step
            </button>
            <button className="border border-slate-300 bg-white px-3 py-2 text-sm font-bold" onClick={() => reset()}>
              Reset
            </button>
          </div>
        </aside>

        <section className="overflow-hidden border border-slate-200 bg-slate-950">
          <PonziGame snapshot={state} />
        </section>

        <aside className="space-y-4">
          <Panel title="Live Solvency">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Inflow" value={`$${compact(state.totalInflow)}`} />
              <Metric label="Paid out" value={`$${compact(state.totalPaidOut)}`} />
              <Metric label="Reserves" value={`$${compact(state.reserves)}`} />
              <Metric label="Unpaid" value={`$${compact(state.unpaidLiabilities)}`} danger={state.unpaidLiabilities > 0} />
            </div>
            <div className="mt-4 h-3 bg-slate-200">
              <div
                className={`h-3 ${state.collapseRisk > 0.7 ? 'bg-red-500' : 'bg-sky-500'}`}
                style={{ width: `${Math.round(state.collapseRisk * 100)}%` }}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-700">{latestEvent}</p>
          </Panel>

          <Panel title="Levels">
            <div className="max-h-[330px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white text-slate-500">
                  <tr>
                    <th className="py-2">Level</th>
                    <th className="py-2 text-right">Population</th>
                    <th className="py-2 text-right">At or above</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.level} className="border-t border-slate-100">
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

function Panel({ title, children }) {
  return (
    <section className="border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-black uppercase tracking-normal text-slate-500">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ label, value, danger = false }) {
  return (
    <div className={`border p-3 ${danger ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="text-[11px] font-bold uppercase tracking-normal text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-black ${danger ? 'text-red-700' : 'text-slate-950'}`}>{value}</div>
    </div>
  );
}

function Slider({ label, value, display, min, max, step, disabled, onChange }) {
  return (
    <label className={`mt-4 block ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-center justify-between text-sm font-bold">
        {label}
        <span className="text-sky-700">{display}</span>
      </span>
      <input
        className="mt-2 w-full accent-sky-600"
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

function compact(value) {
  return Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
