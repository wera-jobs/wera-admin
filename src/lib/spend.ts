// How close AI spend is to the global monthly cap. At the cap the API
// stops every AI feature for everyone (scoring, letters, drafts, the
// extension's answers) until the month turns, so admins are warned from 80%.

export const NEAR_CAP = 0.8;

export type SpendLevel = 'ok' | 'near' | 'reached';

export function spendLevel(spend: number, cap: number): SpendLevel {
  if (!(cap > 0)) return 'ok';
  if (spend >= cap) return 'reached';
  return spend >= cap * NEAR_CAP ? 'near' : 'ok';
}

/** The share of the cap spent, 0 to 100. */
export const spendPercent = (spend: number, cap: number) => (cap > 0 ? Math.min(100, (spend / cap) * 100) : 0);
