import { BASE_URL, isApiConfigured } from './config'
import { getAuthSession } from '../lib/authSession'

/** Single canonical request URL: BASE_URL + path (no double slashes). */
function buildApiUrl(path) {
  const base = BASE_URL.replace(/\/+$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function mergeRequestHeaders(extra = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extra,
  }
  try {
    const origin = new URL(BASE_URL)
    if (/ngrok/i.test(origin.hostname)) {
      // Free ngrok may return an HTML interstitial unless this header is sent.
      headers['ngrok-skip-browser-warning'] = '69420'
    }
  } catch {
    // ignore invalid BASE_URL (handled below)
  }
  return headers
}

export async function apiRequest(path, options = {}) {
  if (!isApiConfigured) {
    const msg = !BASE_URL
      ? 'API base URL is not set. Add EXPO_PUBLIC_API_BASE_URL=https://<subdomain>.ngrok-free.dev (no /api suffix) to .env and restart Expo with -c.'
      : 'Replace YOUR_NGROK_URL in .env with your real ngrok host, save, then run: npx expo start -c'
    console.log('API ERROR:', msg)
    throw new Error(msg)
  }
  const session = await getAuthSession()
  const headers = mergeRequestHeaders({
    ...(options.headers || {}),
  })
  if (session.token) headers.Authorization = `Bearer ${session.token}`
  const url = buildApiUrl(path)
  let res
  try {
    res = await fetch(url, {
      ...options,
      headers,
    })
  } catch (e) {
    console.log('API ERROR:', e)
    throw new Error(
      `Network request failed. Is ngrok running (ngrok http 5000) and EXPO_PUBLIC_API_BASE_URL correct? Current: ${BASE_URL}`
    )
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  const looksLikeHtml = typeof text === 'string' && /^\s*</.test(text)
  if (res.ok && looksLikeHtml) {
    const msg =
      'Server returned HTML instead of JSON (often ngrok browser warning). Tunnel or BASE_URL may be wrong.'
    console.log('API ERROR:', msg, 'url:', url)
    throw new Error(msg)
  }
  if (!res.ok) {
    if (res.status === 404) {
      console.log(
        'API ERROR: 404 —',
        url,
        '| Fix: (1) Run backend: npm run backend:start (2) Run: ngrok http 5000 (3) Copy the NEW https URL into .env — free ngrok URLs change when the tunnel restarts (4) npx expo start -c'
      )
    }
    const error = new Error(data?.error || `Request failed (${res.status})`)
    console.log('API ERROR:', error)
    throw error
  }
  return data
}

