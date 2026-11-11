import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { audit, company, content, run, stubApi } from '../test/fixtures';
import { renderAdmin, jsonBody } from '../test/render';

describe('RunsPage', () => {
  it("lists runs and shows a failed run's error", async () => {
    stubApi({ 'GET /api/admin/runs': () => ({ runs: [run({ id: 11, status: 'failed', error: 'fetch: context deadline exceeded' }), run()] }) });
    renderAdmin('/runs');
    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(screen.queryByText(/deadline exceeded/)).toBeNull();
    await userEvent.click(screen.getByText('failed'));
    expect(screen.getByText('fetch: context deadline exceeded')).toBeInTheDocument();
  });
});

describe('UsagePage', () => {
  it('shows totals and flags users past their budget', async () => {
    stubApi();
    renderAdmin('/usage');
    expect(await screen.findByText('66.7%')).toBeInTheDocument();
    expect(screen.getByText('102%')).toHaveClass('text-bad');
  });
});

describe('CompaniesPage', () => {
  it('puts failing companies first and filters to them', async () => {
    stubApi({
      'GET /api/admin/companies': () => ({ companies: [company(), company({ id: 2, name: 'Broken Co', last_fetch_ok: false, last_fetch_error: 'HTTP 404', jobs_open: 0 })] }),
    });
    renderAdmin('/companies');
    const rows = await screen.findAllByRole('row');
    expect(rows[1]).toHaveTextContent('Broken Co');
    expect(screen.getByText('HTTP 404')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/Only failing/));
    expect(screen.queryByText('Jump Trading')).toBeNull();
  });
});

describe('ContentPage', () => {
  it('shows hidden content with the moderation reason, and publishes it', async () => {
    let set: Record<string, string> = {};
    stubApi({ 'PUT /api/admin/content/post/5/status': (init) => ((set = jsonBody(init)), undefined) });
    renderAdmin('/content');
    expect(await screen.findByText('How I got my offer')).toBeInTheDocument();
    expect(screen.getByText(/Looks like an advert\. \(spam\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(set).toEqual({ status: 'published' }));
  });

  it('asks before deleting, and filters by kind', async () => {
    let deleted = false;
    const urls: string[] = [];
    stubApi({
      'GET /api/admin/content': (_i, url) => ((urls.push(url.search)), { items: [content({ kind: 'comment', id: 9, status: 'published', moderation: null })] }),
      'DELETE /api/admin/content/comment/9': () => ((deleted = true), undefined),
    });
    renderAdmin('/content');
    await userEvent.click(await screen.findByRole('button', { name: /Delete…/ }));
    await userEvent.click(screen.getByRole('button', { name: /Delete for good/ }));
    await waitFor(() => expect(deleted).toBe(true));
    await userEvent.click(screen.getByRole('button', { name: 'Comments' }));
    await waitFor(() => expect(urls.some((u) => u.includes('kind=comment') && u.includes('status=rejected'))).toBe(true));
  });
});

describe('EmailPage', () => {
  it('previews templates and sends a test when email is on', async () => {
    let to = '';
    stubApi({
      'GET /api/admin/email': () => ({
        config: { enabled: true, provider: 'smtp', from: 'Wera <hi@wera.example>', public_url: 'https://wera.example' },
        templates: ['verify', 'digest'],
        outbox: [{ id: 1, to: 'ada@example.com', tag: 'digest', subject: 'Your matches', status: 'failed', attempts: 3, last_error: '550 mailbox full', created_at: '2026-10-13T00:00:00Z', sent_at: null }],
      }),
      'POST /api/admin/email/test': (init) => ((to = jsonBody<{ to: string }>(init).to), { queued_to: 'me@example.com' }),
    });
    renderAdmin('/email');
    expect(await screen.findByTitle('Confirm email email preview')).toHaveAttribute('src', '/api/admin/email/preview/verify');
    await userEvent.click(screen.getByRole('button', { name: 'Daily digest' }));
    expect(screen.getByTitle('Daily digest email preview')).toBeInTheDocument();
    expect(screen.getByText('550 mailbox full')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Test recipient'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: /Send test/ }));
    expect(await screen.findByText('Test queued to me@example.com.')).toBeInTheDocument();
    expect(to).toBe('me@example.com');
  });
});

describe('AuditPage', () => {
  it('describes each change and loads older ones', async () => {
    stubApi({
      'GET /api/admin/audit': (_i, url) =>
        url.searchParams.get('before')
          ? { entries: [audit(1, { action: 'run.trigger', target: '', detail: {} })] }
          : { entries: Array.from({ length: 50 }, (_, i) => audit(100 - i)) },
    });
    renderAdmin('/audit');
    expect((await screen.findAllByText('Changed an account')).length).toBe(50);
    expect(screen.getAllByText('monthly budget usd: 25')[0]).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Older' }));
    expect(await screen.findByText('Started a pipeline run')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Older' })).toBeNull();
  });
});

describe('TrafficPage', () => {
  const day = (d: string, visitors: number, pageviews: number, signups = 0) => ({ day: d, visitors, pageviews, sessions: visitors, bounces: 1, signups, avg_visit_seconds: 42 });
  const traffic = (days: number) => ({
    days, time_zone: 'UTC',
    totals: { visitors: 15, pageviews: 40, sessions: 18, bounce_rate: 38.9, avg_visit_seconds: 125, views_per_visit: 2.2, signups: 2, live_visitors: 3 },
    per_day: [day('2026-11-10', 5, 12), day('2026-11-11', 10, 28, 2)],
    pages: [{ label: '/', visitors: 12, pageviews: 20, avg_engaged_seconds: 30 }, { label: '/jobs/:id', visitors: 4, pageviews: 9 }],
    landing: [{ label: '/', visitors: 12, sessions: 14, bounce_rate: 42.9, avg_engaged_seconds: 31 }],
    referrers: [{ label: 'linkedin.com', visitors: 6, sessions: 7, bounce_rate: 20, avg_engaged_seconds: 80 }],
    campaigns: null, devices: [{ label: 'Mobile', visitors: 9 }], browsers: null, systems: null, countries: [{ label: 'KE', visitors: 5 }],
    requests: [{ day: '2026-11-10', requests: 900, errors_4xx: 10, errors_5xx: 0, avg_ms: 40 }, { day: '2026-11-11', requests: 1200, errors_4xx: 12, errors_5xx: 3, avg_ms: 55 }],
    top_routes: [{ route: '/api/jobs/{id}', method: 'GET', requests: 800, errors_5xx: 3, avg_ms: 70 }],
  });

  it("shows today's visitors against yesterday, where they came from, and the API's errors", async () => {
    const asked: string[] = [];
    stubApi({ 'GET /api/admin/traffic': (_init, url) => (asked.push(String(url)), traffic(30)) });
    renderAdmin('/traffic');
    expect(await screen.findByText('+5 vs yesterday')).toBeInTheDocument();
    expect(screen.getByText('3 on the site now')).toBeInTheDocument();
    expect(screen.getByText('39%')).toBeInTheDocument();
    expect(screen.getByText('2m 05s')).toBeInTheDocument();
    expect(screen.getByText('linkedin.com')).toBeInTheDocument();
    expect(screen.getByText('/api/jobs/{id}')).toBeInTheDocument();
    expect(screen.getByText('0.14% of 2.1k requests')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '7d' }));
    await waitFor(() => expect(asked.some((u) => u.includes('days=7'))).toBe(true));
  });
});
