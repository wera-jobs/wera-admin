import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { compact, money } from '../lib/format';
import type { DayCount, RequestDay, TrafficDay, UsageDay } from '../api/types';

const AXIS_TICK = {
  fill: 'var(--color-faint)',
  fontSize: 10,
  fontFamily: '"Geist Mono", monospace',
} as const;

/** Series colors for the stacked token chart, also used by its legend. */
const TOKEN_SERIES: [string, string][] = [
  ['cached input', 'var(--color-accent-2)'],
  ['uncached input', 'var(--color-series-dim)'],
  ['output', 'var(--color-good)'],
];

interface TipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

/** Tooltip styled like the rest of the UI: dark card, mono values. */
function ChartTip({
  active,
  payload,
  label,
  format,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  format: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-xl">
      <div className="font-mono text-[10px] text-faint">{label}</div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: p.color }} />
            <span className="text-muted">{p.name}</span>
            <span className="ml-auto pl-4 font-mono tabular-nums text-text">
              {format(Number(p.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "10-07" for a day, "10-07 14:00" for a timestamp (one bar per run). */
function shortDay(day: string): string {
  return day.slice(5, 16).replace('T', ' ');
}

/** New jobs per day, or per run when the labels are timestamps. */
export function NewJobsChart({ data }: { data: DayCount[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => compact(v)} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: 'var(--color-cursor)' }}
            content={<ChartTip format={(v) => String(v)} />}
          />
          <Bar dataKey="count" name="new jobs" fill="var(--color-accent)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Tokens per day, stacked: uncached input / cached input / output. */
export function TokensChart({ data }: { data: UsageDay[] }) {
  const rows = data.map((d) => ({
    day: d.day,
    'cached input': d.cached_tokens,
    'uncached input': Math.max(d.prompt_tokens - d.cached_tokens, 0),
    output: d.completion_tokens,
  }));
  return (
    <>
      <div className="mb-1 flex flex-wrap gap-3 px-1">
        {TOKEN_SERIES.map(([name, color]) => (
          <span key={name} className="flex items-center gap-1.5 text-[11px] text-faint">
            <span className="size-1.5 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
      <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v: number) => compact(v)}
          />
          <Tooltip
            cursor={{ fill: 'var(--color-cursor)' }}
            content={<ChartTip format={compact} />}
          />
          <Bar dataKey="cached input" stackId="t" fill="var(--color-accent-2)" maxBarSize={28} />
          <Bar dataKey="uncached input" stackId="t" fill="var(--color-series-dim)" maxBarSize={28} />
          <Bar dataKey="output" stackId="t" fill="var(--color-good)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </>
  );
}

/** LLM cost per day. */
export function CostChart({ data }: { data: UsageDay[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={shortDay}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            minTickGap={16}
          />
          <YAxis
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={(v: number) => money(v)}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-faint)' }}
            content={<ChartTip format={money} />}
          />
          <Area
            type="monotone"
            dataKey="cost_usd"
            name="cost"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#costFill)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Visitors and page views per day. */
export function TrafficChart({ data }: { data: TrafficDay[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => compact(v)} allowDecimals={false} />
          <Tooltip cursor={{ stroke: 'var(--color-border)' }} content={<ChartTip format={(v) => compact(v)} />} />
          <Area type="monotone" dataKey="pageviews" name="page views" stroke="var(--color-accent-2)" fill="var(--color-accent-2)" fillOpacity={0.12} strokeWidth={2} />
          <Area type="monotone" dataKey="visitors" name="visitors" stroke="var(--color-accent)" fill="var(--color-accent)" fillOpacity={0.18} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** API requests per day, server errors on top. */
export function RequestsChart({ data }: { data: RequestDay[] }) {
  const rows = data.map((d) => ({ day: d.day, ok: d.requests - d.errors_5xx, errors: d.errors_5xx }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-grid)" vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => compact(v)} allowDecimals={false} />
          <Tooltip cursor={{ fill: 'var(--color-cursor)' }} content={<ChartTip format={(v) => compact(v)} />} />
          <Bar dataKey="ok" name="answered" stackId="r" fill="var(--color-accent-2)" maxBarSize={28} />
          <Bar dataKey="errors" name="server errors" stackId="r" fill="var(--color-bad)" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
