import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, ArrowRight, OctagonAlert } from 'lucide-react';
import { useOverview } from '../api/admin';
import { money } from '../lib/format';
import { spendLevel, spendPercent } from '../lib/spend';

/** On every admin page, from 80% of the monthly AI cap: before the cap stops AI for everyone, and once it has. */
export function SpendBanner() {
  const q = useOverview();
  if (!q.data) return null;
  const { overview: o, monthly_cap_usd: cap } = q.data;
  const level = spendLevel(o.month_spend_usd, cap);
  if (level === 'ok') return null;
  const reached = level === 'reached';
  const Icon = reached ? OctagonAlert : AlertTriangle;
  return (
    <div role={reached ? 'alert' : 'status'}
      className={clsx('mb-5 flex flex-wrap items-start gap-x-3 gap-y-1 rounded-card border px-4 py-3 text-sm',
        reached ? 'border-bad/40 bg-bad/10 text-bad' : 'border-warn/40 bg-warn/10 text-warn')}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {reached
            ? `AI spend has reached the ${money(cap)} monthly cap`
            : `AI spend is at ${Math.floor(spendPercent(o.month_spend_usd, cap))}% of the ${money(cap)} monthly cap`}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          {reached
            ? 'Scoring and every other AI feature are off for everyone until next month. Raise MAX_MONTHLY_COST_USD on the server to turn them back on.'
            : `${money(o.month_spend_usd)} spent so far. At the cap, scoring and every other AI feature stop for everyone until next month; raise MAX_MONTHLY_COST_USD on the server before then if needed.`}
        </p>
      </div>
      <Link to="/usage" className="inline-flex items-center gap-1 self-center text-xs font-medium hover:underline">AI usage <ArrowRight className="size-3" /></Link>
    </div>
  );
}
