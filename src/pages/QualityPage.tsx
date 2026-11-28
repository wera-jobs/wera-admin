// Autofill quality from real use: of the fields Wera filled, how many the
// person left as they were (accuracy), and how many of the fields it read it
// filled (coverage), by applicant system and by what the field asks. The
// extension reports purposes only, never values.
import { useState } from 'react';
import clsx from 'clsx';
import { useAutofillQuality, type QualityRow } from '../api/admin';
import { errorMessage } from '../api/client';
import { Card, PageHeader, Th } from '../components/Page';
import { EmptyState, ErrorState, Skeleton } from '../components/States';
import { pct } from '../lib/format';

const tone = (acc: number, filled: number) => (filled === 0 ? 'text-faint' : acc < 0.8 ? 'text-bad' : acc < 0.95 ? 'text-warn' : 'text-good');

function Rows({ rows, first }: { rows: QualityRow[]; first: string }) {
  return (
    <table className="w-full text-xs">
      <thead className="border-b border-border">
        <tr><Th>{first}</Th><Th className="text-right">Fields</Th><Th className="text-right">Filled</Th><Th className="text-right">Changed</Th><Th className="text-right">Accuracy</Th><Th className="text-right">Coverage</Th></tr>
      </thead>
      <tbody className="font-mono">
        {rows.map((r) => (
          <tr key={`${r.system}|${r.purpose}`} className="border-b border-border/50">
            <td className="py-2 pr-3 font-sans text-text">{first === 'System' ? r.system : `${r.purpose} · ${r.system}`}</td>
            <td className="py-2 pr-3 text-right text-muted">{r.fields}</td>
            <td className="py-2 pr-3 text-right text-muted">{r.filled}</td>
            <td className="py-2 pr-3 text-right text-muted">{r.changed}</td>
            <td className={clsx('py-2 pr-3 text-right', tone(r.accuracy, r.filled))}>{r.filled ? pct(r.accuracy * 100, 0) : '—'}</td>
            <td className="py-2 pr-3 text-right text-muted">{pct(r.coverage * 100, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function QualityPage() {
  const [days, setDays] = useState(30);
  const q = useAutofillQuality(days);
  const rows = q.data?.rows ?? [];
  const systems = rows.filter((r) => r.purpose === '');
  const worst = rows.filter((r) => r.purpose !== '' && r.filled > 0).slice(0, 40);
  return (
    <div className="space-y-4">
      <PageHeader title="Autofill quality"
        hint="Of the fields Wera filled, the share people left as filled (accuracy), and of the fields it read, the share it filled (coverage). Reported per page when people move on or submit; purposes only, never what they typed."
        actions={(
          <select aria-label="Period" value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
            {[7, 30, 90].map((d) => <option key={d} value={d}>Last {d} days</option>)}
          </select>
        )} />
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
        : q.isLoading ? <Skeleton className="h-64 w-full" />
        : !rows.length ? <EmptyState title="No reports yet" hint="They arrive as people move autofilled pages on or submit them, from extension 0.22." />
        : (
          <>
            <Card title="By applicant system">
              <Rows rows={[...systems].sort((a, b) => b.fields - a.fields)} first="System" />
            </Card>
            <Card title="Worst fields first">
              <Rows rows={worst} first="Field" />
            </Card>
          </>
        )}
    </div>
  );
}
