import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { overview, run, stubApi } from '../test/fixtures';
import { jsonResponse, renderAdmin } from '../test/render';

describe('OverviewPage', () => {
  it('says when nothing needs attention', async () => {
    stubApi();
    renderAdmin();
    expect(await screen.findByText('Nothing right now.')).toBeInTheDocument();
    expect(screen.getByText(/of \$100\.00 cap/)).toBeInTheDocument();
  });

  it('lists what needs attention, with links', async () => {
    stubApi({
      'GET /api/admin/overview': () => overview({ last_run_status: 'failed', companies_failing: 3, content_hidden: 1, reports_open: 2, email_failed_7d: 2, month_spend_usd: 95 }),
    });
    renderAdmin();
    expect(await screen.findByText('The last pipeline run failed')).toBeInTheDocument();
    expect(screen.getByText('3 companies failed their last fetch').closest('a')).toHaveAttribute('href', '/companies');
    expect(screen.getByText('1 post or comment hidden by moderation')).toBeInTheDocument();
    expect(screen.getByText('2 problem reports from the extension to read').closest('a')).toHaveAttribute('href', '/reports');
    expect(screen.getByText('2 emails failed this week')).toBeInTheDocument();
    expect(screen.getByText('AI spend is at 95% of the $100.00 monthly cap')).toBeInTheDocument();
  });

  it('starts a run, and says when one is already going', async () => {
    let started = 0;
    stubApi({
      'POST /api/admin/runs': () => ((started += 1), started === 1 ? { status: 'triggered' } : jsonResponse(409, { error: 'a pipeline run is already in progress' })),
      'GET /api/admin/runs': () => ({ runs: [run()] }),
    });
    renderAdmin();
    await userEvent.click(await screen.findByRole('button', { name: 'Run now' }));
    expect(await screen.findByText('Run started. It shows up under Runs.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Run now' }));
    expect(await screen.findByText('a pipeline run is already in progress')).toBeInTheDocument();
  });

  it('navigates from the sidebar', async () => {
    stubApi();
    renderAdmin();
    await screen.findByRole('heading', { name: 'Overview' });
    await userEvent.click(screen.getAllByRole('link', { name: 'Audit log' })[0]);
    expect(await screen.findByRole('heading', { name: 'Audit log' })).toBeInTheDocument();
  });
});

describe('the spend warning on every page', () => {
  it('stays away below 80% of the cap', async () => {
    stubApi({ 'GET /api/admin/overview': () => overview({ month_spend_usd: 50 }) });
    renderAdmin('/users');
    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/monthly cap/)).toBeNull();
  });

  it('warns from 80%, on any page', async () => {
    stubApi({ 'GET /api/admin/overview': () => overview({ month_spend_usd: 85 }) });
    renderAdmin('/users');
    expect(await screen.findByText('AI spend is at 85% of the $100.00 monthly cap')).toBeInTheDocument();
    expect(screen.getByText(/stop for everyone until next month/)).toBeInTheDocument();
  });

  it('says AI is off for everyone once the cap is reached', async () => {
    stubApi({ 'GET /api/admin/overview': () => overview({ month_spend_usd: 100.4 }) });
    renderAdmin('/users');
    expect(await screen.findByRole('alert')).toHaveTextContent('AI spend has reached the $100.00 monthly cap');
    expect(screen.getByRole('alert')).toHaveTextContent(/off for everyone until next month/);
  });
});
