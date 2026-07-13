import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

function renderAt(path) {
  window.history.replaceState({}, '', path);
  return render(<App />);
}

beforeEach(() => {
  vi.useRealTimers();
  document.title = '';
});

describe('routed educational product', () => {
  it('renders the home page and navigates through the primary journey', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.getByRole('heading', { name: /See the promise/i })).toBeInTheDocument();
    expect(document.title).toMatch(/Ponzi Simulator/);

    await user.click(screen.getByRole('link', { name: 'Hall of Harm' }));
    expect(screen.getByRole('heading', { name: 'Hall of Harm' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/hall-of-harm');
  });

  it('renders case, learning, methodology, and not-found routes', () => {
    const { unmount } = renderAt('/cases/madoff');
    expect(screen.getByRole('heading', { name: /Bernard L. Madoff/i })).toBeInTheDocument();
    expect(screen.getByText(/direct accounts/i)).toBeInTheDocument();
    unmount();

    renderAt('/learn/mlm');
    expect(screen.getByRole('heading', { level: 1, name: /MLM, retail sales/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /FTC consumer guidance/i })).toHaveLength(2);
  });

  it('renders the learning index and methodology source registry', () => {
    const { unmount } = renderAt('/learn');
    expect(screen.getByRole('heading', { name: /Learn how the pressure builds/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Read guide/i })).toHaveLength(4);
    unmount();

    renderAt('/methodology');
    expect(screen.getByRole('heading', { name: 'Methodology and sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Two engines, one cash ledger' })).toBeInTheDocument();
  });

  it('opens and closes the responsive navigation control', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const toggle = screen.getByRole('button', { name: 'Toggle navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a useful 404 for unknown records and paths', () => {
    renderAt('/cases/not-a-case');
    expect(screen.getByRole('heading', { name: /This trail runs cold/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Return home/i })).toHaveAttribute('href', '/');
  });
});

describe('Hall of Harm controls', () => {
  it('sorts and filters while preserving state in the URL', async () => {
    const user = userEvent.setup();
    renderAt('/hall-of-harm');

    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('Madoff');
    await user.click(within(table).getByRole('button', { name: /People affected/i }));
    expect(window.location.search).toContain('sort=affectedPeople');
    await user.click(within(table).getByRole('button', { name: /People affected/i }));
    expect(window.location.search).toContain('dir=asc');

    await user.selectOptions(screen.getByLabelText('Scheme type'), 'investment-ponzi');
    expect(screen.getByText(/Showing 3 cases/)).toBeInTheDocument();
    expect(window.location.search).toContain('type=investment-ponzi');
  });

  it('adds a clearly labelled inflation comparison', async () => {
    const user = userEvent.setup();
    renderAt('/hall-of-harm');
    await user.click(screen.getByLabelText(/Compare money in 2024 dollars/i));
    expect(screen.getAllByText('2024 USD').length).toBeGreaterThan(0);
    expect(window.location.search).toContain('dollars=2024');
  });
});

describe('simulator interactions', () => {
  it('keeps the quick number and slider controls synchronized and steps the model', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=custom-recruitment');
    const number = screen.getByLabelText('Recruits per active participant');
    const slider = screen.getByLabelText('Recruits per active participant slider');

    fireEvent.change(slider, { target: { value: '3.2' } });
    expect(number).toHaveValue(3.2);
    await user.click(screen.getByRole('button', { name: 'Step' }));
    expect(screen.getByText('1/48')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Results 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'The recruitment tree' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Recruitment tree at period 1/i })).toBeInTheDocument();
  });

  it('switches between discriminated scheme forms', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=custom-recruitment');
    expect(screen.getByLabelText('Joining fee')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Investment Ponzi' }));
    expect(screen.getByLabelText('Deposit per new participant')).toBeInTheDocument();
    expect(screen.queryByLabelText('Joining fee')).not.toBeInTheDocument();
  });

  it('protects historical baselines and enables a what-if copy', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=madoff');
    const deposit = screen.getByLabelText('Deposit per new participant');
    expect(deposit).toBeDisabled();
    expect(screen.getByText('Immutable historical baseline')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Make a copy' }));
    expect(deposit).toBeEnabled();
    expect(screen.getByText('What-if copy')).toBeInTheDocument();
  });

  it('opens advanced recruitment rules and edits the collections', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=custom-recruitment');
    await user.click(screen.getByText('Advanced rules'));
    const initialRemoveButtons = screen.getAllByRole('button', { name: 'Remove' }).length;
    await user.click(screen.getByRole('button', { name: 'Add rule' }));
    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(initialRemoveButtons + 1);
    await user.click(screen.getByRole('button', { name: 'Add tier' }));
    expect(screen.getByDisplayValue('Tier 5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add shock' }));
    expect(screen.getByDisplayValue(/public warning slows recruitment/i)).toBeInTheDocument();
  });

  it('exercises advanced fields, rule editors, shocks, reset, speed, and timeline review', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=custom-recruitment');
    await user.click(screen.getByText('Advanced rules'));

    for (const [label, value] of [
      ['Recruitment retained each period', '80'],
      ['Baseline churn', '7'],
      ['Retail margin', '35'],
      ['Refund rate on churn', '12'],
      ['Product / operating cost', '25'],
      ['Operator diversion', '9'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });

    fireEvent.change(screen.getAllByLabelText('Trigger')[0], { target: { value: 'retail-sale' } });
    fireEvent.change(screen.getAllByLabelText('Depth')[0], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText(/^Rate/)[0], { target: { value: '4' } });
    fireEvent.change(screen.getAllByLabelText('Minimum rank')[0], { target: { value: 'silver' } });

    fireEvent.change(screen.getAllByLabelText('Tier name')[0], { target: { value: 'Starter' } });
    fireEvent.change(screen.getAllByLabelText('Direct recruits')[0], { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Active downline')[0], { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Team volume')[0], { target: { value: '0' } });
    fireEvent.change(screen.getAllByLabelText('Multiplier')[0], { target: { value: '1' } });
    fireEvent.change(screen.getAllByLabelText('Bonus')[0], { target: { value: '0' } });

    await user.click(screen.getByRole('button', { name: 'Add shock' }));
    fireEvent.change(screen.getByLabelText('Period'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Recruiting multiplier'), { target: { value: '0.4' } });
    fireEvent.change(screen.getByLabelText('Event label'), { target: { value: 'A warning is published.' } });
    await user.click(screen.getByLabelText('Ends the replay'));

    await user.click(screen.getByRole('button', { name: 'Step' }));
    await user.selectOptions(screen.getByLabelText('Speed'), '2');
    fireEvent.change(screen.getByLabelText(/Review period/), { target: { value: '0' } });
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByText('0/48')).toBeInTheDocument();
  });

  it('edits the investment-specific advanced cash assumptions', async () => {
    const user = userEvent.setup();
    renderAt('/simulator?scenario=custom-investment');
    await user.click(screen.getByText('Advanced rules'));
    for (const [label, value] of [
      ['Recurring deposit', '700'],
      ['Genuine revenue on reserves', '2'],
      ['Operator diversion', '6'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    await user.click(screen.getByRole('button', { name: 'Add shock' }));
    fireEvent.change(screen.getByLabelText('Withdrawal multiplier'), { target: { value: '4' } });
    expect(screen.getByLabelText('Recurring deposit')).toHaveValue(700);
  });
});
