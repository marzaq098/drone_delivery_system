/**
 * Quantum Drop Drone — Fleet Management Dashboard
 *
 * EXPO / REACT NATIVE: Leaflet runs inside WebView (vanilla Leaflet 1.9 from CDN).
 * `react-leaflet` requires react-dom and does not run in React Native.
 *
 * ── Web SPA (Vite/Next) with react-leaflet + Tailwind ────────────────────────
 *   npm install react-leaflet leaflet
 *   npm install -D tailwindcss postcss autoprefixer
 *   npx tailwindcss init -p
 *   import 'leaflet/dist/leaflet.css'
 *   Use <MapContainer>, <TileLayer>, <Marker>, <Popup>, <CircleMarker> from
 *   react-leaflet; mirror drone state and simulation from this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { WebView } from 'react-native-webview'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { K } from '../constants/kenyaBrand'

const C = {
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  green500: '#22c55e',
  blue500: '#3b82f6',
  orange500: '#f97316',
  rose600: '#e11d48',
  cyan600: K.green,
  indigo600: K.black,
  white: '#ffffff',
}

const INITIAL_DRONES = [
  {
    id: 'DR-001',
    status: 'Idle',
    battery: 88,
    lat: -1.2864,
    lng: 36.8172,
    place: 'CBD — City Hall',
  },
  {
    id: 'DR-002',
    status: 'Delivering',
    battery: 72,
    lat: -1.265,
    lng: 36.802,
    place: 'Westlands route',
  },
  {
    id: 'DR-003',
    status: 'Charging',
    battery: 24,
    lat: -1.319,
    lng: 36.768,
    place: 'Karen hub · Dock A',
  },
  {
    id: 'DR-004',
    status: 'Idle',
    battery: 95,
    lat: -1.303,
    lng: 36.844,
    place: 'Eastlands · Donholm',
  },
  {
    id: 'DR-005',
    status: 'Delivering',
    battery: 41,
    lat: -1.278,
    lng: 36.825,
    place: 'Parklands · Ring Rd',
  },
  {
    id: 'DR-006',
    status: 'Idle',
    battery: 18,
    lat: -1.292,
    lng: 36.795,
    place: 'Kilimani · Yaya',
  },
]

function buildFleetMapHtml() {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; height: 100%; }
    #map { width: 100%; height: 100vh; }
    .pulse { animation: pulse 1.5s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.08); opacity: 0.9; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      var map = L.map('map', { zoomControl: true }).setView([-1.286, 36.817], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      }).addTo(map);
      var markers = {};
      var didFitBounds = false;
      function colorFor(status, selected) {
        var c = status === 'Idle' ? '#22c55e' : status === 'Delivering' ? '#3b82f6' : '#f97316';
        if (selected) return '#a855f7';
        return c;
      }
      function iconFor(d, selected) {
        var r = selected ? 22 : 18;
        var c = colorFor(d.status, selected);
        var pulse = d.status === 'Delivering' ? 'pulse' : '';
        var html = '<div class="' + pulse + '" style="width:' + (r*2) + 'px;height:' + (r*2) +
          'px;border-radius:50%;background:' + c + ';border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:800;">' +
          (selected ? '★' : '✈') + '</div>';
        return L.divIcon({ html: html, className: '', iconSize: [r*2, r*2], iconAnchor: [r, r] });
      }
      function popupHtml(d) {
        return '<div style="min-width:140px;font-family:system-ui,sans-serif;font-size:13px">' +
          '<b>' + d.id + '</b><br/>' + d.status + '<br/>🔋 ' + Math.round(d.battery) + '%<br/>📍 ' + (d.place || '') + '</div>';
      }
      window.updateFleet = function (payloadJson) {
        var payload = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : payloadJson;
        var list = payload.drones;
        var sel = payload.selectedId;
        var bounds = [];
        list.forEach(function (d) {
          var selected = sel === d.id;
          if (!markers[d.id]) {
            var m = L.marker([d.lat, d.lng], { icon: iconFor(d, selected) }).addTo(map);
            m.on('click', function () {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: d.id }));
              }
            });
            m.bindPopup(popupHtml(d));
            markers[d.id] = m;
          } else {
            markers[d.id].setLatLng([d.lat, d.lng]);
            markers[d.id].setIcon(iconFor(d, selected));
            markers[d.id].setPopupContent(popupHtml(d));
          }
          bounds.push([d.lat, d.lng]);
        });
        if (bounds.length && !didFitBounds) {
          map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
          didFitBounds = true;
        }
      };
      window.openPopupFor = function (id) {
        if (markers[id]) {
          markers[id].openPopup();
          map.panTo(markers[id].getLatLng());
        }
      };
    })();
  </script>
</body>
</html>`
}

function statusColor(status) {
  switch (status) {
    case 'Idle':
      return C.green500
    case 'Delivering':
      return C.blue500
    case 'Charging':
      return C.orange500
    default:
      return C.slate500
  }
}

export default function FleetDashboard() {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const wide = width >= 780
  const webRef = useRef(null)

  const [drones, setDrones] = useState(INITIAL_DRONES)
  const [selectedId, setSelectedId] = useState(INITIAL_DRONES[0].id)
  const [log, setLog] = useState([
    { t: new Date().toISOString(), msg: 'Nairobi fleet ops online · all hubs' },
  ])

  const pushLog = useCallback((msg) => {
    setLog((prev) => [{ t: new Date().toISOString(), msg }, ...prev].slice(0, 25))
  }, [])

  const syncMap = useCallback(() => {
    const payload = JSON.stringify({ drones, selectedId })
    const js = `window.updateFleet && window.updateFleet(${JSON.stringify(payload)}); true;`
    webRef.current?.injectJavaScript(js)
  }, [drones, selectedId])

  useEffect(() => {
    const t = setTimeout(syncMap, 400)
    return () => clearTimeout(t)
  }, [syncMap])

  useEffect(() => {
    const id = setInterval(() => {
      setDrones((prev) =>
        prev.map((d) => {
          let { lat, lng, battery, status } = d
          if (status === 'Delivering') {
            lat += (Math.random() - 0.45) * 0.0012
            lng += (Math.random() - 0.45) * 0.0012
            battery = Math.max(0, battery - (0.15 + Math.random() * 0.35))
          } else if (status === 'Idle') {
            battery = Math.max(0, battery - (0.02 + Math.random() * 0.05))
          } else if (status === 'Charging') {
            battery = Math.min(100, battery + 1.2 + Math.random())
            if (battery >= 96) status = 'Idle'
          }
          if (battery < 12 && status !== 'Charging') {
            status = 'Charging'
            pushLog(d.id + ' auto-docked (low battery)')
          }
          return { ...d, lat, lng, battery, status }
        })
      )
    }, 2200)
    return () => clearInterval(id)
  }, [pushLog])

  const lowBattery = useMemo(() => drones.filter((d) => d.battery < 20), [drones])

  const stats = useMemo(() => {
    const total = drones.length
    const active = drones.filter((d) => d.status === 'Delivering').length
    const idle = drones.filter((d) => d.status === 'Idle').length
    const deliveries = active
    return { total, active, idle, deliveries }
  }, [drones])

  function injectSelect(id) {
    setSelectedId(id)
    setTimeout(() => {
      webRef.current?.injectJavaScript(
        `window.openPopupFor && window.openPopupFor(${JSON.stringify(id)}); true;`
      )
    }, 80)
  }

  const onWebMessage = useCallback((e) => {
    try {
      const data = JSON.parse(e.nativeEvent.data)
      if (data.type === 'select' && data.id) setSelectedId(data.id)
    } catch {
      /* ignore */
    }
  }, [])

  function assignDelivery(id) {
    setDrones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Delivering' } : d))
    )
    pushLog(id + ' → delivery assigned')
  }

  function sendCharge(id) {
    setDrones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Charging' } : d))
    )
    pushLog(id + ' → charging dock')
  }

  function recall(id) {
    setDrones((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'Idle' } : d))
    )
    pushLog(id + ' → recalled to idle')
  }

  const mapHeight = wide
    ? Math.min(420, Math.max(280, height * 0.42))
    : Math.min(340, Math.max(240, height * 0.38))

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
      <View style={styles.header}>
        <Text style={styles.title}>Fleet ops</Text>
        <Text style={styles.sub}>Quantum Drop · Nairobi skyline</Text>
      </View>

        {lowBattery.length > 0 ? (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={20} color={C.white} />
            <Text style={styles.alertText}>
              Low battery (&lt;20%): {lowBattery.map((d) => d.id).join(', ')}
            </Text>
          </View>
        ) : null}

        <View style={[styles.statsRow, !wide && styles.statsRowNarrow]}>
          <StatChip label="Total" value={stats.total} accent={C.cyan600} />
          <StatChip label="Active" value={stats.active} accent={C.blue500} />
          <StatChip label="Idle" value={stats.idle} accent={C.green500} />
          <StatChip label="Deliveries" value={stats.deliveries} accent={C.indigo600} />
        </View>

        <View style={[wide ? styles.row : styles.col, wide && styles.rowAlignStart]}>
          <View style={[styles.mapBox, { height: mapHeight, minHeight: 260 }, wide && styles.mapWide]}>
            <WebView
              ref={webRef}
              originWhitelist={['*']}
              source={{ html: buildFleetMapHtml(), baseUrl: 'https://example.com' }}
              style={styles.webview}
              scrollEnabled={false}
              onMessage={onWebMessage}
              onLoadEnd={syncMap}
              javaScriptEnabled
              domStorageEnabled
              {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' } : {})}
            />
          </View>

          <View style={[styles.panel, wide && styles.panelWide]}>
            <Text style={styles.panelTitle}>Drone status</Text>
            {drones.map((d) => {
              const sel = d.id === selectedId
              return (
                <Pressable
                  key={d.id}
                  onPress={() => injectSelect(d.id)}
                  style={[styles.droneCard, sel && styles.droneCardSel]}
                >
                  <View style={styles.droneRow}>
                    <Text style={styles.droneId}>{d.id}</Text>
                    <View style={[styles.badge, { borderColor: statusColor(d.status) }]}>
                      <Text style={[styles.badgeTxt, { color: statusColor(d.status) }]}>{d.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.bat}>
                    🔋 {Math.round(d.battery)}% · {d.place}
                  </Text>
                  <Text style={styles.coord}>
                    {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                  </Text>
                  <View style={styles.actions}>
                    <MiniBtn label="Assign" onPress={() => assignDelivery(d.id)} />
                    <MiniBtn label="Charge" onPress={() => sendCharge(d.id)} />
                    <MiniBtn label="Recall" onPress={() => recall(d.id)} />
                  </View>
                </Pressable>
              )
            })}

            <Text style={styles.panelTitle}>Activity</Text>
            <View style={styles.timeline}>
              {log.map((line, i) => (
                <Text key={i} style={styles.logLine} numberOfLines={2}>
                  {line.t.slice(11, 19)} — {line.msg}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

function StatChip({ label, value, accent }) {
  return (
    <View style={[styles.statChip, { borderLeftColor: accent }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </View>
  )
}

function MiniBtn({ label, onPress }) {
  return (
    <Pressable style={styles.miniBtn} onPress={onPress}>
      <Text style={styles.miniBtnTxt}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },
  mainScroll: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: C.slate900 },
  sub: { fontSize: 13, color: C.slate500, marginTop: 2 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: C.rose600,
    borderRadius: 12,
  },
  alertText: { flex: 1, color: C.white, fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statsRowNarrow: { flexDirection: 'column' },
  statChip: {
    flexGrow: 1,
    minWidth: 72,
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  statLabel: { fontSize: 12, color: C.slate500, fontWeight: '600' },
  statVal: { fontSize: 20, fontWeight: '800', color: C.slate900 },
  row: { flexDirection: 'row', width: '100%' },
  col: { flexDirection: 'column', width: '100%' },
  rowAlignStart: { alignItems: 'flex-start' },
  mapBox: { width: '100%' },
  mapWide: { flex: 1, minWidth: 0 },
  webview: { flex: 1, backgroundColor: C.slate200 },
  panel: { width: '100%', backgroundColor: C.slate50, paddingHorizontal: 12 },
  panelWide: {
    maxWidth: 380,
    width: 380,
    flexGrow: 0,
    flexShrink: 0,
    borderLeftWidth: 1,
    borderLeftColor: C.slate200,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.slate800,
    marginTop: 8,
    marginBottom: 8,
  },
  droneCard: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  droneCardSel: {
    borderColor: C.indigo600,
    borderWidth: 2,
    backgroundColor: '#eef2ff',
  },
  droneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  droneId: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: C.slate50,
  },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  bat: { marginTop: 6, fontSize: 13, color: C.slate600 },
  coord: { fontSize: 11, color: C.slate500, marginTop: 2, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  miniBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.indigo600,
  },
  miniBtnTxt: { color: C.white, fontWeight: '700', fontSize: 12 },
  timeline: {
    backgroundColor: C.white,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  logLine: { fontSize: 11, color: C.slate600, marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
})
