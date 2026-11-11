import { useState } from 'react';
import clsx from 'clsx';
import { useTraffic } from '../api/admin';
import { errorMessage } from '../api/client';
import type { TrafficRow } from '../api/types';
import { RequestsChart, TrafficChart } from '../components/Charts';
import { Card, PageHeader, Th } from '../components/Page';
import { ErrorState, Skeleton } from '../components/States';
import { StatTile } from '../components/StatTile';
import { compact, pct } from '../lib/format';

const RANGES = [7, 30, 90] as const;

/** "2m 05s" for a number of seconds. */
function duration(s: number | null | undefined): string {
  if (s == null || !Number.isFinite(s)) return '—';
  const total = Math.round(s);
  return total >= 60 ? `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s` : `${total}s`;
}

/** A change from yesterday, as a trend chip. */
function change(today: number, yesterday: number, unit = ''): { text: string; tone: 'good' | 'bad' | 'neutral' } {
  const d = today - yesterday;
  return { text: `${d > 0 ? '+' : ''}${d}${unit} vs yesterday`, tone: d > 0 ? 'good' : d < 0 ? 'bad' : 'neutral' };
}

/** A breakdown table: label, visitors and what else the rows carry. */
function Breakdown({ rows, label, visits = false, views = false }: { rows: TrafficRow[] | null | undefined; label: string; visits?: boolean; views?: boolean }) {
  const list = rows ?? [];
  if (!list.length) return <p className="py-6 text-center text-xs text-faint">No visits yet.</p>;
  const top = Math.max(...list.map((r) => r.visitors), 1);
  return (
    <table className="w-full text-xs">
      <thead className="border-b border-border">
        <tr>
          <Th>{label}</Th>
          <Th className="text-right">Visitors</Th>
          {views && <Th className="text-right">Views</Th>}
          {visits && <Th className="text-right">Bounce</Th>}
          {(visits || views) && <Th className="text-right">Time</Th>}
        </tr>
      </thead>
      <tbody className="font-mono">
        {list.map((r) => (
          <tr key={r.label} className="border-b border-border/50">
            <td className="relative py-2 pr-3 font-sans text-text">
              <span className="absolute inset-y-1 left-0 rounded bg-accent/10" style={{ width: `${(100 * r.visitors) / top}%` }} aria-hidden />
              <span className="relative break-all">{r.label}</span>
            </td>
            <td className="py-2 pr-3 text-right text-text">{compact(r.visitors)}</td>
            {views && <td className="py-2 pr-3 text-right text-muted">{compact(r.pageviews ?? 0)}</td>}
            {visits && <td className="py-2 pr-3 text-right text-muted">{pct(r.bounce_rate ?? 0, 0)}</td>}
            {(visits || views) && <td className="py-2 pr-3 text-right text-muted">{duration(r.avg_engaged_seconds)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Who visits the site and how the API is used: visitors, page views,
 * visits, bounce rate and time on site (counted without cookies), where
 * people come from, and requests per day and route.
 */
export default function TrafficPage() {
  const [days, setDays] = useState<number>(30);
  const q = useTraffic(days);
  const t = q.data?.totals;
  const perDay = q.data?.per_day ?? [];
  const today = perDay.at(-1);
  const yesterday = perDay.at(-2);
  const requests = q.data?.requests ?? [];
  const reqToday = requests.at(-1);
  const reqTotal = requests.reduce((n, d) => n + d.requests, 0);
  const err5 = requests.reduce((n, d) => n + d.errors_5xx, 0);
  const signupRate = t && t.visitors > 0 ? (100 * t.signups) / t.visitors : 0;
  const loading = q.isLoading;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Traffic"
        hint="Visits to the site, counted without cookies: a visitor is counted once a day. A bounce is a visit that saw one page for under 10 seconds."
        actions={
          <div className="flex rounded-lg border border-border p-0.5" role="group" aria-label="Range">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={clsx('rounded-md px-2.5 py-1 font-mono text-xs', days === r ? 'bg-surface-2 text-text' : 'text-muted hover:text-text')}>
                {r}d
              </button>
            ))}
          </div>
        }
      />
      {q.isLoadingError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Visitors today" value={today?.visitors ?? 0} accent
              sub={t ? `${t.live_visitors} on the site now` : undefined}
              delta={today && yesterday ? change(today.visitors, yesterday.visitors) : undefined} />
            <StatTile label="Page views today" value={today?.pageviews ?? 0}
              delta={today && yesterday ? change(today.pageviews, yesterday.pageviews) : undefined} />
            <StatTile label={`Visitors, ${days} days`} value={t?.visitors ?? 0} spark={perDay.map((d) => d.visitors)}
              sub={t ? `${compact(t.pageviews)} page views, ${compact(t.sessions)} visits` : undefined} />
            <StatTile label="Bounce rate" value={pct(t?.bounce_rate, 0)} sub={t ? `${t.views_per_visit.toFixed(1)} pages a visit` : undefined} />
            <StatTile label="Time on site" value={duration(t?.avg_visit_seconds)} sub="average visit, page in view" />
            <StatTile label={`Signups, ${days} days`} value={t?.signups ?? 0} sub={t && signupRate <= 100 ? `${pct(signupRate)} of visitors` : 'some from visits not counted'}
              bars={perDay.map((d) => ({ day: d.day, count: d.signups }))} />
            <StatTile label="API requests today" value={reqToday?.requests ?? 0}
              sub={reqToday ? `${Math.round(reqToday.avg_ms)} ms on average` : undefined} />
            <StatTile label={`Server errors, ${days} days`} value={err5}
              sub={reqTotal ? `${pct((100 * err5) / reqTotal, 2)} of ${compact(reqTotal)} requests` : undefined}
              delta={err5 > 0 ? { text: 'see routes below', tone: 'bad' } : undefined} />
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card title="Visitors and page views">{loading ? <Skeleton className="h-56 w-full" /> : <TrafficChart data={perDay} />}</Card>
            <Card title="API requests">{loading ? <Skeleton className="h-56 w-full" /> : <RequestsChart data={requests} />}</Card>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            <Card title="Pages"><Breakdown rows={q.data?.pages} label="Page" views /></Card>
            <Card title="Landing pages"><Breakdown rows={q.data?.landing} label="First page of a visit" visits /></Card>
            <Card title="Where visitors come from"><Breakdown rows={q.data?.referrers} label="Site" visits /></Card>
            <Card title="Campaigns"><Breakdown rows={q.data?.campaigns} label="utm_source / utm_campaign" visits /></Card>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Card title="Devices"><Breakdown rows={q.data?.devices} label="Device" /></Card>
            <Card title="Browsers"><Breakdown rows={q.data?.browsers} label="Browser" /></Card>
            <Card title="Systems"><Breakdown rows={q.data?.systems} label="System" /></Card>
            <Card title="Countries"><Breakdown rows={q.data?.countries} label="Country" /></Card>
          </div>
          <Card title="Busiest API routes">
            <table className="w-full text-xs">
              <thead className="border-b border-border">
                <tr><Th>Route</Th><Th className="text-right">Requests</Th><Th className="text-right">Server errors</Th><Th className="text-right">Average</Th></tr>
              </thead>
              <tbody className="font-mono">
                {(q.data?.top_routes ?? []).map((r) => (
                  <tr key={`${r.method} ${r.route}`} className="border-b border-border/50">
                    <td className="py-2 pr-3 text-text"><span className="text-faint">{r.method}</span> {r.route}</td>
                    <td className="py-2 pr-3 text-right text-text">{compact(r.requests)}</td>
                    <td className={clsx('py-2 pr-3 text-right', r.errors_5xx ? 'text-bad' : 'text-muted')}>{compact(r.errors_5xx)}</td>
                    <td className="py-2 pr-3 text-right text-muted">{Math.round(r.avg_ms)} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
