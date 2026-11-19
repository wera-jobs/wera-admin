import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useOverview } from '../api/admin';
import { errorMessage } from '../api/client';
import { Card, PageHeader } from '../components/Page';
import { RunNowButton } from '../components/RunNowButton';
import { RunStatus } from '../components/RunStatus';
import { ErrorState, SkeletonRows } from '../components/States';
import { StatTile } from '../components/StatTile';
import { money, relTime } from '../lib/format';

/** The state of the whole service, and what needs an admin's attention. */
export default function OverviewPage() {
  const q = useOverview();
  if (q.isLoading) return <><PageHeader title="Overview" /><SkeletonRows rows={6} /></>;
  if (!q.data) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  const { overview: o, monthly_cap_usd: cap, email_enabled: emailOn } = q.data;
  const spendPct = cap > 0 ? Math.min(100, (o.month_spend_usd / cap) * 100) : 0;

  const attention: { text: string; to: string }[] = [];
  if (o.last_run_status === 'failed') attention.push({ text: 'The last pipeline run failed', to: '/runs' });
  if (o.companies_failing > 0) attention.push({ text: `${o.companies_failing} compan${o.companies_failing === 1 ? 'y' : 'ies'} failed their last fetch`, to: '/companies' });
  if (o.content_hidden > 0) attention.push({ text: `${o.content_hidden} post${o.content_hidden === 1 ? '' : 's'} or comment${o.content_hidden === 1 ? '' : 's'} hidden by moderation`, to: '/content' });
  if (o.reports_open) attention.push({ text: `${o.reports_open} problem report${o.reports_open === 1 ? '' : 's'} from the extension to read`, to: '/reports' });
  if (o.email_failed_7d > 0) attention.push({ text: `${o.email_failed_7d} email${o.email_failed_7d === 1 ? '' : 's'} failed this week`, to: '/email' });
  if (cap > 0 && spendPct >= 80) attention.push({ text: `AI spend is at ${Math.round(spendPct)}% of the monthly cap`, to: '/usage' });

  return (
    <div className="space-y-5">
      <PageHeader title="Overview" hint="Accounts, jobs, AI spend and the pipeline at a glance. Refreshes every 30 seconds." actions={q.data.run_trigger && <RunNowButton />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Users" value={o.users} sub={`${o.users_with_profile} with a profile · ${o.admins} admin${o.admins === 1 ? '' : 's'}`} />
        <StatTile label="Active this week" value={o.active_7d} sub={`${o.signups_7d} new this week`} />
        <StatTile label="Open jobs" value={o.jobs_open} sub={`${o.jobs_new_24h.toLocaleString()} new in 24 h · ${o.jobs_added_open} added by users`} />
        <StatTile label="Waiting for a score" value={o.pending_scores} sub="matches across all users" />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card title="AI spend this month">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-2xl font-semibold text-text">{money(o.month_spend_usd)}</span>
            {cap > 0 && <span className="text-xs text-muted">of {money(cap)} cap</span>}
          </div>
          {cap > 0 && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={Math.round(spendPct)} aria-label="Spend against the monthly cap">
              <div className={spendPct >= 90 ? 'h-full bg-bad' : spendPct >= 80 ? 'h-full bg-warn' : 'h-full bg-accent'} style={{ width: `${spendPct}%` }} />
            </div>
          )}
          <Link to="/usage" className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline">By user and day <ArrowRight className="size-3" /></Link>
        </Card>
        <Card title="Pipeline">
          <div className="flex items-center gap-2 text-sm">
            {o.last_run_at ? <><RunStatus status={o.last_run_status} /><span className="text-muted">last run {relTime(o.last_run_at)}</span></> : <span className="text-muted">No runs yet</span>}
          </div>
          <p className="mt-2 text-xs text-muted">
            {o.companies_enabled} companies watched{o.companies_failing > 0 && <>, <span className="text-bad">{o.companies_failing} failing</span></>}.
          </p>
          <Link to="/runs" className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline">All runs <ArrowRight className="size-3" /></Link>
        </Card>
        <Card title="Email">
          <p className="text-sm text-text">{emailOn ? 'Sending' : 'Off'}</p>
          <p className="mt-2 text-xs text-muted">{o.email_queued} queued · {o.email_failed_7d} failed this week</p>
          <Link to="/email" className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:underline">Outbox and templates <ArrowRight className="size-3" /></Link>
        </Card>
      </div>

      <Card title="Needs attention">
        {attention.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-good"><CheckCircle2 className="size-4" /> Nothing right now.</p>
        ) : (
          <ul className="divide-y divide-border">
            {attention.map((a) => (
              <li key={a.text}>
                <Link to={a.to} className="flex items-center gap-2 py-2 text-sm text-text hover:text-accent">
                  <AlertTriangle className="size-4 text-warn" /> {a.text} <ArrowRight className="ml-auto size-3.5 text-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
