/**
 * Kenya-focused brand tokens & KES formatting for Quantum Drop Drone (Nairobi).
 */

export const K = {
  green: '#006600',
  greenMuted: '#e8f5e9',
  greenDark: '#004d00',
  red: '#c41e1e',
  redLight: '#fef2f2',
  black: '#0d0d0d',
  sand: '#f6f5f0',
  white: '#ffffff',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
}

/** Format amount in Kenyan Shillings (whole shillings for display clarity). */
export function formatKes(amount) {
  const n = Math.round(Number(amount) || 0)
  return `KSh ${n.toLocaleString('en-KE')}`
}

/** Typical Kenya VAT on goods (display only — mock checkout). */
export const VAT_RATE_KE = 0.16
