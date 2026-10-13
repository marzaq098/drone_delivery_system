/** @typedef {'customer' | 'vendor' | 'fleet'} UserRole */

/**
 * @param {string | string[] | undefined} raw
 * @returns {UserRole}
 */
export function normalizeRole(raw) {
  const v = Array.isArray(raw) ? raw[0] : raw
  if (v === 'vendor' || v === 'fleet' || v === 'customer') return v
  return 'customer'
}

/**
 * @param {UserRole} role
 * @returns {`/dashboard` | `/vendor` | `/fleet`}
 */
export function routeForRole(role) {
  if (role === 'vendor') return '/vendor'
  if (role === 'fleet') return '/fleet'
  return '/dashboard'
}
