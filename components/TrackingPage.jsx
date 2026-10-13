/**
 * Quantum Drop Drone — Live tracking (Leaflet map in WebView)
 *
 * Expo / React Native cannot run react-leaflet (it needs react-dom). This screen
 * embeds Leaflet 1.9 from CDN inside a WebView — same tiles, markers, and polylines
 * as a Leaflet web app.
 *
 * ── Optional: pure web stack (Vite/CRA) with react-leaflet + Tailwind ─────────
 *   npm install react-leaflet leaflet
 *   npm install -D tailwindcss postcss autoprefixer
 *   npx tailwindcss init -p
 * Import leaflet.css once: import 'leaflet/dist/leaflet.css'
 * Wrap map in <MapContainer> from react-leaflet and use <TileLayer>, <Marker>,
 * <Polyline> — mirror the same coordinates and simulation logic below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { K } from '../constants/kenyaBrand'
import * as Location from 'expo-location'
import { createTrackingSocket } from '../lib/trackingSocket'

const C = {
  cyan600: '#22d3ee',
  indigo600: '#4f46e5',
  slate50: '#f8fafc',
  slate100: '#eef4ff',
  slate200: '#e2e8f0',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: K.black,
  emerald600: '#059669',
  white: '#ffffff',
}

const DEFAULT_DEST = { lat: -1.2864, lng: 36.8172 }
const WEATHER = '22C · clear wind'

function buildLeafletHtml(startLat, startLng, droneLat, droneLng, destLat, destLng) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    #map { width: 100%; height: 100vh; }
    .drone-wrap {
      animation: drone-hover 1.4s ease-in-out infinite;
      filter: drop-shadow(0 2px 4px rgba(15,23,42,0.35));
    }
    @keyframes drone-hover {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-4px) rotate(2deg); }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var destLat = ${destLat}, destLng = ${destLng};
      var map = L.map('map', { zoomControl: true }).setView([${startLat}, ${startLng}], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);

      var droneHtml = '<div class="drone-wrap" style="font-size:26px;line-height:1;text-align:center">🚁</div>';
      var droneIcon = L.divIcon({ html: droneHtml, className: '', iconSize: [36, 36], iconAnchor: [18, 18] });
      var droneMarker = L.marker([${droneLat}, ${droneLng}], { icon: droneIcon, zIndexOffset: 1000 }).addTo(map);

      var userIcon = L.divIcon({
        html: '<div style="font-size:20px">🧍</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28]
      });
      var userMarker = L.marker([${startLat}, ${startLng}], { icon: userIcon, zIndexOffset: 900 }).addTo(map);

      var destIcon = L.divIcon({
        html: '<div style="font-size:22px">📍</div>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      var destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);

      var route = L.polyline(
        [[${droneLat}, ${droneLng}], [destLat, destLng]],
        { color: '#6366f1', weight: 4, opacity: 0.9, dashArray: '8 6' }
      ).addTo(map);

      map.fitBounds(L.latLngBounds([[${startLat}, ${startLng}], [${droneLat}, ${droneLng}], [destLat, destLng]]), { padding: [48, 48] });

      window.updateDrone = function (lat, lng) {
        droneMarker.setLatLng([lat, lng]);
        route.setLatLngs([[lat, lng], [destLat, destLng]]);
      };
      window.updateUser = function (lat, lng) {
        userMarker.setLatLng([lat, lng]);
      };
    })();
  </script>
</body>
</html>`
}

function haversineKm(a, b) {
  const toRad = (v) => (v * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s1 = Math.sin(dLat / 2)
  const s2 = Math.sin(dLng / 2)
  const q =
    s1 * s1 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2
  return 2 * R * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q))
}

export default function TrackingPage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const params = useLocalSearchParams()
  const orderId = params.orderId ?? 'ORD-' + String(Date.now()).slice(-6)
  const droneId = params.droneId ?? `DRN-${String(orderId).slice(-4)}`

  const webRef = useRef(null)
  const watchRef = useRef(null)
  const socketRef = useRef(null)
  const fallbackTimerRef = useRef(null)
  const fallbackStartedAtRef = useRef(0)

  const [gpsReady, setGpsReady] = useState(false)
  const [userPos, setUserPos] = useState(null)
  const [dronePos, setDronePos] = useState(null)
  const [destination, setDestination] = useState(DEFAULT_DEST)
  const [etaMins, setEtaMins] = useState(12)
  const [status, setStatus] = useState('Waiting for drone telemetry')
  const [battery, setBattery] = useState(96)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [deliveredOpen, setDeliveredOpen] = useState(false)
  const [socketLive, setSocketLive] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  const parsedDestLat = Number(params.destLat)
  const parsedDestLng = Number(params.destLng)
  const hasParamDestination = Number.isFinite(parsedDestLat) && Number.isFinite(parsedDestLng)

  const html = useMemo(
    () => {
      const up = userPos || DEFAULT_DEST
      const dp = dronePos || up
      return buildLeafletHtml(up.lat, up.lng, dp.lat, dp.lng, destination.lat, destination.lng)
    },
    [userPos, dronePos, destination.lat, destination.lng]
  )

  const injectDrone = useCallback((lat, lng) => {
    const js = `window.updateDrone && window.updateDrone(${lat}, ${lng}); true;`
    webRef.current?.injectJavaScript(js)
  }, [])
  const injectUser = useCallback((lat, lng) => {
    const js = `window.updateUser && window.updateUser(${lat}, ${lng}); true;`
    webRef.current?.injectJavaScript(js)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const perm = await Location.requestForegroundPermissionsAsync()
      if (perm.status !== 'granted') {
        if (mounted) setGpsError('Location permission denied')
        return
      }
      const enabled = await Location.hasServicesEnabledAsync()
      if (!enabled) {
        if (mounted) setGpsError('GPS is disabled on this device')
        return
      }
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      if (!mounted) return
      const here = { lat: current.coords.latitude, lng: current.coords.longitude }
      setUserPos(here)
      setDronePos((prev) => prev || here)
      if (hasParamDestination) {
        setDestination({ lat: parsedDestLat, lng: parsedDestLng })
      } else {
        setDestination(here)
      }
      setGpsReady(true)
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 4000,
          distanceInterval: 8,
        },
        (loc) => {
          const p = { lat: loc.coords.latitude, lng: loc.coords.longitude }
          setUserPos(p)
          injectUser(p.lat, p.lng)
        }
      )
    })()
    return () => {
      mounted = false
      watchRef.current?.remove()
      watchRef.current = null
    }
  }, [hasParamDestination, parsedDestLat, parsedDestLng, injectUser])

  useEffect(() => {
    if (!gpsReady || !userPos) return
    const socket = createTrackingSocket({
      droneId,
      orderId,
      onConnect: () => setSocketLive(true),
      onDisconnect: () => setSocketLive(false),
      onTelemetry: (payload) => {
        const lat = Number(payload?.latitude)
        const lng = Number(payload?.longitude)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return
        setUsingFallback(false)
        const nextStatus = payload?.status || 'IN_TRANSIT'
        setStatus(nextStatus)
        setBattery(
          Number.isFinite(Number(payload?.battery)) ? Number(payload.battery) : 0
        )
        setSpeedKmh(
          Number.isFinite(Number(payload?.speed)) ? Math.round(Number(payload.speed)) : 0
        )
        const pos = { lat, lng }
        setDronePos(pos)
        injectDrone(lat, lng)
        if (String(nextStatus).toUpperCase() === 'DELIVERED') {
          setDeliveredOpen(true)
        }
      },
    })
    socketRef.current = socket
    return () => {
      socketRef.current?.disconnect()
      socketRef.current = null
    }
  }, [gpsReady, userPos, droneId, orderId, injectDrone])

  useEffect(() => {
    if (!gpsReady || !userPos || !destination || socketLive) return
    setUsingFallback(true)
    setStatus('In transit')
    fallbackStartedAtRef.current = Date.now()
    const start = userPos
    const end = destination
    const totalKm = Math.max(0.15, haversineKm(start, end))
    const kmPerMin = 0.55
    const totalMs = (totalKm / kmPerMin) * 60 * 1000
    fallbackTimerRef.current = setInterval(() => {
      const t = Math.min(1, (Date.now() - fallbackStartedAtRef.current) / totalMs)
      const lat = start.lat + (end.lat - start.lat) * t
      const lng = start.lng + (end.lng - start.lng) * t
      setDronePos({ lat, lng })
      injectDrone(lat, lng)
      setSpeedKmh(33)
      setBattery((b) => Math.max(8, b - 0.2))
      setEtaMins(Math.max(0, Math.ceil((1 - t) * (totalKm / kmPerMin))))
      if (t >= 1) {
        setStatus('Delivered')
        setSpeedKmh(0)
        setDeliveredOpen(true)
        clearInterval(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }, 1200)
    return () => {
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current)
        fallbackTimerRef.current = null
      }
    }
  }, [gpsReady, userPos, destination, socketLive, injectDrone])

  useEffect(() => {
    if (!dronePos) return
    const km = haversineKm(dronePos, destination)
    const liveEta = Math.ceil((km / 0.55))
    if (Number.isFinite(liveEta) && liveEta >= 0) setEtaMins(liveEta)
  }, [dronePos, destination])

  const distanceKm = useMemo(() => {
    if (!dronePos) return 0
    const dx = destination.lat - dronePos.lat
    const dy = destination.lng - dronePos.lng
    return Math.sqrt(dx * dx + dy * dy) * 111
  }, [destination.lat, destination.lng, dronePos])

  return (
    <View style={styles.screen}>
      <View style={[styles.mapShell, { width, height }]}>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://example.com' }}
          style={styles.webview}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onLoadEnd={() => {
            if (userPos) injectUser(userPos.lat, userPos.lng)
            if (dronePos) injectDrone(dronePos.lat, dronePos.lng)
          }}
          {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' } : {})}
        />

        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <Pressable style={styles.iconBtnGlass} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.white} />
          </Pressable>
          <View style={styles.headerMid}>
            <Text style={styles.headerTitle}>Live tracking</Text>
            <Text style={[styles.headerSub, { maxWidth: width - 120 }]} numberOfLines={2}>
              {orderId}
            </Text>
          </View>
          <View style={styles.iconBtnGlass}>
            <Ionicons name="partly-sunny-outline" size={18} color={C.cyan600} />
          </View>
        </View>

        <View style={[styles.overlayCard, { bottom: 16 + insets.bottom }]} pointerEvents="box-none">
          <View style={styles.card}>
            <Text style={styles.trafficHint} numberOfLines={2}>
              {gpsError
                ? gpsError
                : socketLive
                  ? 'Live telemetry active — real-time drone coordinates from socket.'
                  : usingFallback
                    ? 'Socket offline — fallback path uses real GPS coordinates.'
                    : 'Waiting for telemetry...'}
            </Text>
            <View style={styles.etaRow}>
              <Ionicons name="time-outline" size={22} color={C.cyan600} />
              <Text style={styles.etaLabel}>ETA</Text>
              <Text style={styles.etaValue}>{String(status).toUpperCase() === 'DELIVERED' || status === 'Delivered' ? 'Arrived' : `${etaMins} min`}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusMuted}>Drone status</Text>
              <View style={[styles.pill, status === 'In transit' && styles.pillTransit]}>
                <Text style={styles.pillText}>{status}</Text>
              </View>
            </View>
            <View style={styles.metricsGrid}>
              <Text style={styles.metricText}>Distance: {distanceKm.toFixed(1)} km</Text>
              <Text style={styles.metricText}>Weather: {WEATHER}</Text>
              <Text style={styles.metricText}>Battery: {Math.round(battery)}%</Text>
              <Text style={styles.metricText}>Speed: {speedKmh} km/h</Text>
            </View>
            <Text style={styles.coords} numberOfLines={1}>
              Drone: {dronePos ? `${dronePos.lat.toFixed(4)}, ${dronePos.lng.toFixed(4)}` : 'Acquiring...'} · User:{' '}
              {userPos ? `${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}` : 'GPS pending'}
            </Text>
          </View>
        </View>
        <View style={[styles.footer, { bottom: insets.bottom + 16 }]}>
          <Pressable style={styles.dashboardBtn} onPress={() => router.replace('/dashboard')}>
            <Ionicons name="home-outline" size={20} color={C.white} />
            <Text style={styles.dashboardBtnText}> Back to shop</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={deliveredOpen} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={56} color={C.emerald600} />
            </View>
            <Text style={styles.modalTitle}>Delivered</Text>
            <Text style={styles.modalBody}>
              Your package has arrived. Thanks for using Quantum Drop — Nairobi.
            </Text>
            <Text style={styles.modalOrder}>Order · {orderId}</Text>
            <Pressable style={styles.modalBtn} onPress={() => setDeliveredOpen(false)}>
              <Text style={styles.modalBtnText}>Close</Text>
            </Pressable>
            <Pressable
              style={styles.modalSecondary}
              onPress={() => {
                setDeliveredOpen(false)
                router.replace('/dashboard')
              }}
            >
              <Text style={styles.modalSecondaryText}>Home</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#020617' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  iconBtnGlass: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.35)',
  },
  headerMid: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: C.white },
  headerSub: { fontSize: 12, color: '#cbd5e1', marginTop: 2 },
  mapShell: {
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  webview: { flex: 1, backgroundColor: C.slate200 },
  overlayCard: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  trafficHint: {
    fontSize: 12,
    color: C.slate600,
    lineHeight: 17,
    marginBottom: 12,
    fontWeight: '500',
  },
  card: {
    backgroundColor: 'rgba(15,23,42,0.84)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.3)',
    shadowColor: C.cyan600,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 6,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  etaLabel: { fontSize: 14, fontWeight: '600', color: '#cbd5e1', flex: 1 },
  etaValue: { fontSize: 22, fontWeight: '800', color: C.cyan600 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusMuted: { fontSize: 13, color: '#cbd5e1', fontWeight: '600' },
  pill: {
    backgroundColor: 'rgba(148,163,184,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillTransit: { backgroundColor: 'rgba(34,211,238,0.25)' },
  pillText: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  metricsGrid: {
    gap: 4,
    marginBottom: 8,
  },
  metricText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  coords: { fontSize: 11, color: '#94a3b8', fontVariant: ['tabular-nums'] },
  footer: {
    position: 'absolute',
    right: 16,
    left: 16,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.indigo600,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  dashboardBtnText: { color: C.white, fontSize: 16, fontWeight: '800' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  successIcon: { marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: C.slate900, marginBottom: 8 },
  modalBody: {
    fontSize: 15,
    color: C.slate600,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  modalOrder: { fontSize: 13, color: C.slate500, marginBottom: 16, fontWeight: '600' },
  modalBtn: {
    backgroundColor: K.green,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  modalBtnText: { color: C.white, fontWeight: '800', fontSize: 16 },
  modalSecondary: { marginTop: 12, padding: 8 },
  modalSecondaryText: { color: C.cyan600, fontWeight: '700', fontSize: 15 },
})
