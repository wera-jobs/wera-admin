import type { AdminUser, AuditEntry, Company, ContentItem, Me, OverviewResponse, ProblemReport, Run, Usage } from '../api/types';
import { mockApi } from './render';

export const me: Me = { id: 1, email: 'jesse@example.com', name: 'Jesse', is_admin: true, created_at: '2026-10-01T00:00:00Z' };

export const user = (over: Partial<AdminUser> = {}): AdminUser => ({
  id: 2, email: 'ada@example.com', name: 'Ada', is_admin: false, created_at: '2026-10-02T00:00:00Z', last_login_at: '2026-10-13T00:00:00Z',
  email_verified: true, monthly_budget_usd: 10, month_spend_usd: 2.5, has_profile: true, matches: 420, scored: 120, tracked: 8, applied: 3,
  sessions: 2, extensions: 1, jobs_added: 1, ...over,
});

export const overview = (over: Partial<OverviewResponse['overview']> = {}): OverviewResponse => ({
  overview: {
    users: 7, users_with_profile: 6, signups_7d: 2, active_7d: 5, admins: 1, companies_enabled: 577, companies_failing: 0,
    jobs_open: 83000, jobs_new_24h: 1200, jobs_added_open: 4, pending_scores: 310, month_spend_usd: 12.5, email_queued: 0,
    email_failed_7d: 0, content_hidden: 0, reports_open: 0, last_run_at: '2026-10-14T05:00:00Z', last_run_status: 'ok', ...over,
  },
  monthly_cap_usd: 100, email_enabled: false, run_trigger: true,
});

export const run = (over: Partial<Run> = {}): Run => ({
  id: 10, started_at: '2026-10-14T05:00:00Z', finished_at: '2026-10-14T05:04:00Z', status: 'ok', companies_ok: 570, companies_failed: 7,
  jobs_seen: 83000, jobs_new: 900, jobs_excluded: 700, jobs_scored: 150, prompt_tokens: 900000, cached_tokens: 600000,
  completion_tokens: 50000, cost_usd: 0.42, error: null, ...over,
});

export const usage: Usage = {
  per_day: [{ day: '2026-10-13', prompt_tokens: 1000, cached_tokens: 600, completion_tokens: 200, cost_usd: 0.3 }],
  totals: { analyses: 1200, prompt_tokens: 900000, cached_tokens: 600000, completion_tokens: 50000, cost_usd: 12.5, cached_percent: 66.7 },
  users: [
    { id: 2, email: 'ada@example.com', name: 'Ada', monthly_budget_usd: 10, month_spend_usd: 10.2 },
    { id: 1, email: 'jesse@example.com', name: 'Jesse', monthly_budget_usd: 10, month_spend_usd: 2.3 },
  ],
};

export const report = (over: Partial<ProblemReport> = {}): ProblemReport => ({
  id: 4, user_id: 2, user_email: 'ada@example.com', user_name: 'Ada', created_at: '2026-10-14T05:00:00Z', source: 'extension',
  note: 'The phone box was left empty.', page: 'boards.greenhouse.io/acme/jobs/1', version: '0.16.3', details_size: 52, resolved_at: null, ...over,
});

export const company = (over: Partial<Company> = {}): Company => ({
  id: 1, name: 'Jump Trading', ats: 'greenhouse', token: 'jump', industry: 'trading', enabled: true,
  last_fetch_at: '2026-10-14T05:01:00Z', last_fetch_ok: true, last_fetch_error: null, jobs_open: 40, jobs_scored: 10, ...over,
});

export const content = (over: Partial<ContentItem> = {}): ContentItem => ({
  kind: 'post', id: 5, post_id: 5, title: 'How I got my offer', body: 'Practice, practice.', status: 'rejected',
  moderation: { allowed: false, categories: ['spam'], reason: 'Looks like an advert.' }, author_id: 2, author: 'ada@example.com',
  created_at: '2026-10-13T12:00:00Z', ...over,
});

export const audit = (id: number, over: Partial<AuditEntry> = {}): AuditEntry => ({
  id, actor_id: 1, actor: 'jesse@example.com', action: 'user.update', target: 'user:2', detail: { monthly_budget_usd: 25 },
  created_at: '2026-10-14T06:00:00Z', ...over,
});

type Handler = Parameters<typeof mockApi>[0][string];

/** Stubs every endpoint the console reads; overrides win. */
export function stubApi(overrides: Record<string, Handler> = {}) {
  return mockApi({
    'GET /api/auth/me': () => ({ user: me }),
    'GET /healthz': () => ({ status: 'ok', version: 'v0.3.0', commit: 'abc1234' }),
    'GET /api/admin/overview': () => overview(),
    'GET /api/admin/users': () => ({ users: [user(), user({ id: 1, email: me.email, name: 'Jesse', is_admin: true })] }),
    'GET /api/admin/users/2': () => user(),
    'GET /api/admin/runs': () => ({ runs: [run()] }),
    'GET /api/admin/usage': () => usage,
    'GET /api/admin/companies': () => ({ companies: [company()] }),
    'GET /api/admin/content': () => ({ items: [content()] }),
    'GET /api/admin/audit': () => ({ entries: [audit(3)] }),
    'GET /api/admin/reports': () => ({ reports: [report()] }),
    'GET /api/admin/reports/4': () => report({ details: '{"fields":[{"label":"Phone","status":"skipped"}]}' }),
    'GET /api/admin/email': () => ({ config: { enabled: false }, templates: ['verify', 'digest'], outbox: [] }),
    'GET /api/admin/autofill-quality': () => ({ days: 30, rows: [
      { system: 'Workday', purpose: 'phone', fields: 10, filled: 10, changed: 4, accuracy: 0.6, coverage: 1 },
      { system: 'Workday', purpose: '', fields: 40, filled: 30, changed: 4, accuracy: 0.8667, coverage: 0.75 },
      { system: 'Greenhouse', purpose: '', fields: 20, filled: 20, changed: 0, accuracy: 1, coverage: 1 },
    ] }),
    ...overrides,
  });
}
