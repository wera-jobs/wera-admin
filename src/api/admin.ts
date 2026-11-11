import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  AdminUser, AuditEntry, Company, ContentItem, ContentKind, ContentStatus, EmailOverview, OverviewResponse, Run, Traffic, Usage, UserChange,
} from './types';

// Every admin read refreshes on its own: the console is often left open.
const LIVE = { refetchInterval: 30_000 };

export function useOverview() {
  return useQuery({ queryKey: ['overview'], queryFn: () => api<OverviewResponse>('/api/admin/overview'), ...LIVE });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => api<{ users: AdminUser[] }>('/api/admin/users'), ...LIVE });
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => api<AdminUser>(`/api/admin/users/${id}`),
    enabled: id != null,
  });
}

/** Refreshes the user lists and the overview after a change to accounts. */
function useAccountsChanged() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['users'] });
    void qc.invalidateQueries({ queryKey: ['overview'] });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  };
}

export function useUpdateUser(id: number) {
  const changed = useAccountsChanged();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: UserChange) => api<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(c) }),
    onSuccess: (u) => {
      qc.setQueryData(['users', id], u);
      changed();
    },
  });
}

export function useSignOutUser(id: number) {
  const changed = useAccountsChanged();
  return useMutation({
    mutationFn: () => api<{ ended: number }>(`/api/admin/users/${id}/sign-out`, { method: 'POST' }),
    onSuccess: changed,
  });
}

export function useDeleteUser(id: number) {
  const changed = useAccountsChanged();
  return useMutation({
    mutationFn: (confirmEmail: string) =>
      api<void>(`/api/admin/users/${id}`, { method: 'DELETE', body: JSON.stringify({ confirm_email: confirmEmail }) }),
    onSuccess: changed,
  });
}

export function useRuns(limit = 30) {
  return useQuery({
    queryKey: ['runs', limit],
    queryFn: () => api<{ runs: Run[] }>(`/api/admin/runs?limit=${limit}`),
    // Poll faster while a run is in flight.
    refetchInterval: (q) => (q.state.data?.runs[0] && q.state.data.runs[0].status == null ? 5_000 : 30_000),
  });
}

export function useTriggerRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ status: string }>('/api/admin/runs', { method: 'POST' }),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['runs'] });
      void qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });
}

export function useUsage() {
  return useQuery({ queryKey: ['usage'], queryFn: () => api<Usage>('/api/admin/usage'), ...LIVE });
}

/** The browser's time zone, so "today" on the Traffic page is the admin's day. */
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export function useTraffic(days: number) {
  return useQuery({
    queryKey: ['traffic', days],
    queryFn: () => api<Traffic>(`/api/admin/traffic?days=${days}&tz=${encodeURIComponent(TZ)}`),
    placeholderData: keepPreviousData,
    ...LIVE,
  });
}

export function useCompanies() {
  return useQuery({ queryKey: ['companies'], queryFn: () => api<{ companies: Company[] }>('/api/admin/companies'), ...LIVE });
}

export interface ContentFilter {
  kind: ContentKind | '';
  status: ContentStatus | '';
  offset: number;
}

export const CONTENT_PAGE = 30;

export function useContent(f: ContentFilter) {
  return useQuery({
    queryKey: ['content', f],
    queryFn: () => {
      const p = new URLSearchParams({ limit: String(CONTENT_PAGE), offset: String(f.offset) });
      if (f.kind) p.set('kind', f.kind);
      if (f.status) p.set('status', f.status);
      return api<{ items: ContentItem[] }>(`/api/admin/content?${p}`);
    },
    placeholderData: keepPreviousData,
  });
}

function useContentChanged() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['content'] });
    void qc.invalidateQueries({ queryKey: ['overview'] });
    void qc.invalidateQueries({ queryKey: ['audit'] });
  };
}

export function useSetContentStatus() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: (v: { kind: ContentKind; id: number; status: ContentStatus }) =>
      api<void>(`/api/admin/content/${v.kind}/${v.id}/status`, { method: 'PUT', body: JSON.stringify({ status: v.status }) }),
    onSuccess: changed,
  });
}

export function useDeleteContent() {
  const changed = useContentChanged();
  return useMutation({
    mutationFn: (v: { kind: ContentKind; id: number }) => api<void>(`/api/admin/content/${v.kind}/${v.id}`, { method: 'DELETE' }),
    onSuccess: changed,
  });
}

export function useEmail() {
  return useQuery({ queryKey: ['email'], queryFn: () => api<EmailOverview>('/api/admin/email'), ...LIVE });
}

export function useSendTestEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (to: string) => api<{ queued_to: string }>('/api/admin/email/test', { method: 'POST', body: JSON.stringify({ to }) }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['email'] });
      void qc.invalidateQueries({ queryKey: ['audit'] });
    },
  });
}

export const AUDIT_PAGE = 50;

/** The audit log, newest first, a page at a time. */
export function useAudit() {
  return useInfiniteQuery({
    queryKey: ['audit'],
    queryFn: ({ pageParam }) =>
      api<{ entries: AuditEntry[] }>(`/api/admin/audit?limit=${AUDIT_PAGE}${pageParam ? `&before=${pageParam}` : ''}`),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.entries.length === AUDIT_PAGE ? last.entries[last.entries.length - 1].id : undefined),
  });
}

/** The API's health and build (GET /healthz). */
export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api<{ status: string; version: string; commit: string }>('/healthz'),
    refetchInterval: 30_000,
    retry: false,
  });
}
