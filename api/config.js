/**
 * BASE_URL is the API origin only — no trailing /api.
 * Example: https://your-subdomain.ngrok-free.dev
 * Paths in api/*.js are absolute from origin: /login, /products, …
 */
function normalizeBaseUrl(url) {
  if (!url || typeof url !== 'string') return ''
  let u = url.trim().replace(/\/+$/, '')
  if (!u) return ''
  // Legacy .env had .../api — strip so we never double up paths
  while (u.endsWith('/api')) {
    u = u.replace(/\/api\/?$/, '')
  }
  return u
}

const raw = String(process.env.EXPO_PUBLIC_API_BASE_URL || '').trim()
export const BASE_URL = normalizeBaseUrl(raw)

const HAS_PLACEHOLDER =
  BASE_URL.includes('YOUR_NGROK_URL') ||
  BASE_URL.includes('REPLACE_ME') ||
  BASE_URL.includes('REPLACE-ME')

if (!BASE_URL) {
  console.log('ERROR: API base URL is not set')
} else if (HAS_PLACEHOLDER) {
  console.log(
    'ERROR: .env still has the placeholder YOUR_NGROK_URL. Replace it with your real ngrok host (see ngrok "Forwarding" line), save .env, then run: npx expo start -c'
  )
}

/** False when missing, or still using YOUR_NGROK_URL placeholder (invalid host). */
export const isApiConfigured = Boolean(BASE_URL) && !HAS_PLACEHOLDER

if (__DEV__ && isApiConfigured) {
  console.log('[api] BASE_URL =', BASE_URL)
}
