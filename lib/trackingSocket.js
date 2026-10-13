import { BASE_URL, isApiConfigured } from '../api/config'

function resolveSocketBaseUrl() {
  if (!isApiConfigured) return ''
  const envSocket = String(process.env.EXPO_PUBLIC_TRACKING_SOCKET_URL || '').trim()
  if (envSocket && !envSocket.includes('YOUR_NGROK_URL')) {
    return envSocket.replace(/\/$/, '')
  }
  return BASE_URL.replace(/\/$/, '') || ''
}

export function createTrackingSocket({ droneId, orderId, onTelemetry, onConnect, onDisconnect }) {
  const baseUrl = resolveSocketBaseUrl()
  if (!baseUrl) return null

  const wsUrl = baseUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:')
  const wsOptions =
    /ngrok/i.test(wsUrl) ? { headers: { 'ngrok-skip-browser-warning': '69420' } } : undefined
  const ws = new WebSocket(`${wsUrl}/track/drone`, undefined, wsOptions)
  ws.onopen = () => {
    onConnect?.()
    ws.send(
      JSON.stringify({
        type: 'subscribe',
        payload: { droneId, orderId },
      })
    )
  }
  ws.onclose = () => onDisconnect?.()
  ws.onerror = (err) => {
    console.log('API ERROR:', err)
    onDisconnect?.()
  }
  ws.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data)
      const payload = raw?.payload ?? raw
      onTelemetry?.(payload)
    } catch {
      // Ignore malformed telemetry packets.
    }
  }
  return {
    disconnect: () => ws.close(),
  }
}
