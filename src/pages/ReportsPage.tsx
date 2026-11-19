import { useState } from 'react';
import { Check, ChevronDown, Copy, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { useReport, useReports, useResolveReport } from '../api/admin';
import { errorMessage } from '../api/client';
import type { ProblemReport } from '../api/types';
import { Badge } from '../components/Badge';
import { BUTTON, PageHeader } from '../components/Page';
import { EmptyState, ErrorState, SkeletonRows } from '../components/States';
import { absTime, relTime } from '../lib/format';
import { toast } from '../lib/toast';

/** The diagnostics the extension sent, pretty when they are JSON. */
function Details({ id }: { id: number }) {
  const q = useReport(id, true);
  const [copied, setCopied] = useState(false);
  if (q.isLoading) return <SkeletonRows rows={2} />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  const raw = q.data?.details ?? '';
  let text = raw;
  try {
    text = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    // Cut short by the size limit, or not JSON: show it as it came.
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };
  return (
    <div className="space-y-2">
      {text ? (
        <pre className="max-h-96 overflow-auto rounded-md border border-border bg-surface-2 p-2 font-mono text-[11px] leading-relaxed text-muted">{text}</pre>
      ) : (
        <p className="text-xs text-faint">No details came with this report.</p>
      )}
      {text && <button className={BUTTON} onClick={() => void copy()}>{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? 'Copied' : 'Copy details'}</button>}
    </div>
  );
}

function Item({ r }: { r: ProblemReport }) {
  const resolve = useResolveReport();
  const [open, setOpen] = useState(false);
  const resolved = !!r.resolved_at;
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={resolved ? 'good' : 'warn'}>{resolved ? 'resolved' : 'open'}</Badge>
        <span className="text-muted" title={r.user_email}>{r.user_name || r.user_email}</span>
        <span className="text-faint" title={absTime(r.created_at)}>{relTime(r.created_at)}</span>
        {r.version && <span className="font-mono text-faint">v{r.version}</span>}
      </div>
      <p className="text-sm whitespace-pre-wrap text-text">{r.note || <span className="text-faint">No note.</span>}</p>
      {r.page && <p className="truncate font-mono text-[11px] text-faint" title={r.page}>{r.page}</p>}
      <div className="flex flex-wrap gap-2">
        {r.details_size > 0 && (
          <button className={BUTTON} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <ChevronDown className={clsx('size-3.5 transition-transform', open && 'rotate-180')} /> {open ? 'Hide details' : 'Show details'}
          </button>
        )}
        <button className={BUTTON} disabled={resolve.isPending}
          onClick={() => resolve.mutate({ id: r.id, resolved: !resolved }, {
            onSuccess: () => toast.success(resolved ? 'The report is open again.' : 'Marked resolved.'),
            onError: (e) => toast.error(errorMessage(e, 'Could not change it')),
          })}>
          {resolved ? <><RotateCcw className="size-3.5" /> Reopen</> : <><Check className="size-3.5" /> Mark resolved</>}
        </button>
      </div>
      {open && <Details id={r.id} />}
    </li>
  );
}

/** What people reported from the extension's "Report a problem". */
export default function ReportsPage() {
  const [all, setAll] = useState(false);
  const q = useReports(all);
  const reports = q.data?.reports ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" hint="Problems people reported from the extension: what they wrote, the page, and what the extension read and did there (self-identification answers are left out)." />
      <div className="flex flex-wrap gap-1" role="group" aria-label="Which reports">
        {([[false, 'Open'], [true, 'All']] as const).map(([v, label]) => (
          <button key={label} onClick={() => setAll(v)} aria-pressed={all === v}
            className={clsx('rounded-full border px-2.5 py-1 text-xs font-medium', all === v ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-muted hover:text-text')}>
            {label}
          </button>
        ))}
      </div>
      {q.isLoading ? (
        <SkeletonRows rows={4} />
      ) : q.isLoadingError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : !reports.length ? (
        <EmptyState title={all ? 'No reports yet' : 'Nothing open'} hint="Reports show up here when someone presses Report a problem in the extension." />
      ) : (
        <section className="rounded-card border border-border bg-surface px-4">
          <ul className="divide-y divide-border">{reports.map((r) => <Item key={r.id} r={r} />)}</ul>
        </section>
      )}
    </div>
  );
}
