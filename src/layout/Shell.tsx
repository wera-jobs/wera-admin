import { Suspense, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import { LogOut, Menu, X } from 'lucide-react';
import { useHealth } from '../api/admin';
import { useLogout, useMe } from '../api/auth';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Logo } from '../components/Logo';
import { SkeletonRows } from '../components/States';
import { SpendBanner } from '../components/SpendBanner';
import { ThemeToggle } from '../lib/theme';
import { NAV } from './nav';

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 p-3" aria-label="Admin">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate}
          className={({ isActive }) => clsx(
            'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
            isActive ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text',
          )}>
          <Icon className="size-4" /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

/** "admin v0.1.0 · api 9338ac1": what is running (commits in the tooltip). */
function Versions() {
  const health = useHealth();
  return (
    <span className="flex items-center gap-2 truncate font-mono" title={`admin ${__APP_COMMIT__} · api ${health.data?.commit ?? '?'}`}>
      <span className={clsx('inline-block size-2 shrink-0 rounded-full', health.data ? 'bg-good' : health.isError ? 'bg-bad' : 'bg-warn')}
        aria-label={health.data ? 'API healthy' : 'API unreachable'} />
      v{__APP_VERSION__}{health.data && <> · api {health.data.version}</>}
    </span>
  );
}

function Account() {
  const me = useMe().data;
  const logout = useLogout();
  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-medium text-text">{me?.name || me?.email}</div>
        <div className="truncate text-[11px] text-faint">{me?.email}</div>
      </div>
      <button onClick={() => logout.mutate()} aria-label="Sign out" title="Sign out" className="rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-text">
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <Logo />
      <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-accent uppercase">admin</span>
    </span>
  );
}

export function Shell() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-14 items-center border-b border-border px-5"><Brand /></div>
        <Nav />
        <Account />
        <div className="flex items-center gap-2 border-t border-border px-4 py-3 text-[11px] text-faint">
          <Versions />
          <ThemeToggle className="-my-1 ml-auto" />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-surface">
            <div className="flex h-14 items-center justify-between border-b border-border px-5">
              <Brand />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 text-muted"><X className="size-4" /></button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
            <Account />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-56">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-md p-1.5 text-muted hover:text-text"><Menu className="size-5" /></button>
          <Brand />
          <ThemeToggle className="ml-auto" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
          <SpendBanner />
          <ErrorBoundary resetKey={location.pathname}>
            <Suspense fallback={<SkeletonRows rows={6} />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
