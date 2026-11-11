import { Activity, BarChart3, Building2, Gauge, History, Mail, MessageSquareWarning, Users, Wallet, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: Gauge },
  { to: '/traffic', label: 'Traffic', icon: BarChart3 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/runs', label: 'Runs', icon: Activity },
  { to: '/usage', label: 'AI usage', icon: Wallet },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/content', label: 'Community', icon: MessageSquareWarning },
  { to: '/email', label: 'Email', icon: Mail },
  { to: '/audit', label: 'Audit log', icon: History },
];
