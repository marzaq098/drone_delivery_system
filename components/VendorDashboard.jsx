/**
 * Quantum Drop Drone — Vendor Dashboard (Expo / React Native)
 * Styling follows a Tailwind-like admin palette via StyleSheet.
 * For web + Tailwind, map these styles to utility classes.
 */

import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { K, formatKes } from '../constants/kenyaBrand'
import { useRole } from '../context/RoleContext'
import { postExternalOrder } from '../lib/externalOrders'

const C = {
  slate50: '#f8fafc',
  slate100: K.sand,
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: K.black,
  cyan600: K.green,
  indigo600: K.black,
  emerald600: '#059669',
  amber600: '#d97706',
  rose600: K.red,
  white: '#ffffff',
}

const INITIAL_ORDERS = [
  {
    id: 'QDD-KE-2401',
    customerName: 'Njeri Wanjiku',
    items: 'Groceries box ×1 · Karen',
    status: 'Pending',
    amount: 1200,
  },
  {
    id: 'QDD-KE-2402',
    customerName: 'Otieno K.',
    items: 'Dawa kit + legal courier',
    status: 'Preparing',
    amount: 2240,
  },
  {
    id: 'QDD-KE-2403',
    customerName: 'Kamau Mburu',
    items: 'Hardware XL — Industrial Area',
    status: 'Dispatched',
    amount: 8500,
  },
  {
    id: 'QDD-KE-2404',
    customerName: 'Achieng R.',
    items: 'Phone accessories (priority)',
    status: 'Delivered',
    amount: 2500,
  },
  {
    id: 'QDD-KE-2405',
    customerName: 'Mutua Kyalo',
    items: 'Express parcel ×3 · Westlands',
    status: 'Pending',
    amount: 1350,
  },
]

const INITIAL_PRODUCTS = [
  { id: 'P-101', name: 'Groceries box', price: 1200, stock: 22, category: 'Groceries', isDarkStore: false },
  { id: 'P-102', name: 'Dawa wellness kit', price: 1890, stock: 14, category: 'Pharmacy', isDarkStore: true },
  { id: 'P-103', name: 'Phone accessories pack', price: 2500, stock: 30, category: 'Retail', isDarkStore: false },
]

function statusStyle(status) {
  switch (status) {
    case 'Pending':
      return { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' }
    case 'Preparing':
      return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }
    case 'Ready':
      return { bg: '#dcfce7', text: '#166534', border: '#86efac' }
    case 'Dispatched':
      return { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' }
    case 'Delivered':
      return { bg: '#d1fae5', text: '#047857', border: '#6ee7b7' }
    default:
      return { bg: C.slate100, text: C.slate700, border: C.slate200 }
  }
}

function Sidebar({ wide, active, onNav, notificationCount }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
    { key: 'orders', label: 'Orders', icon: 'list-outline' },
    { key: 'products', label: 'Products', icon: 'cube-outline' },
    { key: 'logout', label: 'Logout', icon: 'log-out-outline' },
  ]

  const NavBtn = ({ item }) => {
    const sel = active === item.key
    return (
      <Pressable
        onPress={() => onNav(item.key)}
        style={[styles.navItem, wide && styles.navItemWide, sel && styles.navItemActive]}
      >
        <Ionicons name={item.icon} size={22} color={sel ? C.cyan600 : C.slate600} />
        <Text style={[styles.navLabel, sel && styles.navLabelActive]} numberOfLines={1}>
          {item.label}
        </Text>
        {item.key === 'orders' && notificationCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
          </View>
        ) : null}
      </Pressable>
    )
  }

  if (wide) {
    return (
      <View style={styles.sidebarWide}>
        <View style={styles.brandBlock}>
          <View style={styles.logoMark}>
            <Text style={styles.logoEmoji}>✈</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>Quantum Drop</Text>
            <Text style={styles.brandSub}>Nairobi partner · Vendor</Text>
          </View>
        </View>
        {items.map((item) => (
          <NavBtn key={item.key} item={item} />
        ))}
      </View>
    )
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.sidebarCompact}
    >
      <View style={styles.brandInline}>
        <Text style={styles.logoEmoji}>✈</Text>
        <Text style={styles.brandTitleSm}>QDD · Nairobi</Text>
      </View>
      {items.map((item) => (
        <NavBtn key={item.key} item={item} />
      ))}
    </ScrollView>
  )
}

function StatCard({ title, value, icon, accent }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: accent }]}>
      <View style={styles.statTop}>
        <Text style={styles.statTitle}>{title}</Text>
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function OrderTable({ orders, onAccept, onReject, onReady, onDispatch, onDeliver, search }) {
  const q = search.trim().toLowerCase()
  const rows = useMemo(() => {
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)
    )
  }, [orders, q])

  return (
    <View style={styles.tableWrap}>
      <Text style={styles.sectionTitle}>Recent orders</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyTable}>No orders match your search.</Text>
      ) : (
        rows.map((order) => (
          <View key={order.id} style={styles.orderCard}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>{order.id}</Text>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: statusStyle(order.status).bg,
                    borderColor: statusStyle(order.status).border,
                  },
                ]}
              >
                <Text style={[styles.statusText, { color: statusStyle(order.status).text }]}>
                  {order.status}
                </Text>
              </View>
            </View>
            <Text style={styles.customer}>{order.customerName}</Text>
            <Text style={styles.items}>{order.items}</Text>
            <Text style={styles.orderAmount}>{formatKes(order.amount)}</Text>
            <View style={styles.actions}>
              {order.status === 'Pending' ? (
                <>
                  <Pressable style={[styles.btn, styles.btnOk]} onPress={() => onAccept(order.id)}>
                    <Text style={styles.btnTxt}>Accept</Text>
                  </Pressable>
                  <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => onReject(order.id)}>
                    <Text style={styles.btnTxt}>Reject</Text>
                  </Pressable>
                </>
              ) : null}
              {order.status === 'Preparing' ? (
                <Pressable style={[styles.btn, styles.btnOk]} onPress={() => onReady(order.id)}>
                  <Text style={styles.btnTxt}>Mark ready</Text>
                </Pressable>
              ) : null}
              {order.status === 'Ready' ? (
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => onDispatch(order.id)}>
                  <Ionicons name="airplane" size={16} color={C.white} />
                  <Text style={styles.btnTxt}> Dispatch drone</Text>
                </Pressable>
              ) : null}
              {order.status === 'Dispatched' ? (
                <Pressable style={[styles.btn, styles.btnOk]} onPress={() => onDeliver(order.id)}>
                  <Text style={styles.btnTxt}>Mark delivered</Text>
                </Pressable>
              ) : null}
              {order.status === 'Delivered' ? (
                <Text style={styles.doneHint}>Completed</Text>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  )
}

export default function VendorDashboard() {
  const router = useRouter()
  const { clearRole } = useRole()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const wide = width >= 820

  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [products, setProducts] = useState(INITIAL_PRODUCTS)
  const [search, setSearch] = useState('')
  const [navActive, setNavActive] = useState('dashboard')
  const [campaignCode, setCampaignCode] = useState('')
  const [campaignDiscount, setCampaignDiscount] = useState('')
  const [campaigns, setCampaigns] = useState([])
  const [externalSyncMessage, setExternalSyncMessage] = useState('')

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'Pending').length
    const completed = orders.filter((o) => o.status === 'Delivered').length
    const revenue = orders
      .filter((o) => o.status === 'Delivered')
      .reduce((s, o) => s + o.amount, 0)
    const popularItems = orders
      .map((o) => o.items.split('·')[0].trim())
      .slice(0, 3)
      .join(', ')
    return {
      totalToday: orders.length,
      pending,
      completed,
      revenue,
      popularItems,
    }
  }, [orders])

  const notificationCount = useMemo(
    () => orders.filter((o) => ['Pending', 'Preparing', 'Ready'].includes(o.status)).length,
    [orders]
  )

  function updateOrder(id, status) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }

  function handleAccept(id) {
    updateOrder(id, 'Preparing')
  }

  function handleReject(id) {
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  function handleDispatch(id) {
    updateOrder(id, 'Dispatched')
  }

  function handleReady(id) {
    updateOrder(id, 'Ready')
  }

  function handleDeliver(id) {
    updateOrder(id, 'Delivered')
  }

  function handleNav(key) {
    setNavActive(key)
    if (key === 'logout') {
      clearRole().then(() => router.replace('/'))
      return
    }
    if (key === 'products') {
      return
    }
    if (key === 'orders') {
      /* scroll could be added with ref; same screen */
      return
    }
  }

  function createCampaign() {
    if (!campaignCode.trim() || !campaignDiscount.trim()) return
    setCampaigns((prev) => [
      ...prev,
      { code: campaignCode.trim().toUpperCase(), discount: Number(campaignDiscount) || 0 },
    ])
    setCampaignCode('')
    setCampaignDiscount('')
  }

  function addProduct() {
    const id = `P-${Date.now().toString().slice(-4)}`
    setProducts((prev) => [
      ...prev,
      { id, name: 'New product', price: 1000, stock: 10, category: 'Retail', isDarkStore: false },
    ])
  }

  function updateProduct(id, patch) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function removeProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  async function importExternalOrder() {
    const payload = {
      vendor: 'Quantum Drop Vendor',
      customerName: 'External partner',
      items: 'API order · bulk',
      amount: 3000,
    }
    const res = await postExternalOrder(payload)
    if (res.ok) {
      setOrders((prev) => [
        {
          id: res.orderId,
          customerName: payload.customerName,
          items: payload.items,
          status: 'Pending',
          amount: payload.amount,
        },
        ...prev,
      ])
      setExternalSyncMessage(`External order synced: ${res.orderId}`)
    } else {
      setExternalSyncMessage('External order sync failed')
    }
  }

  const mainContent = (
    <ScrollView
      style={styles.mainScroll}
      contentContainerStyle={[
        styles.mainInner,
        { paddingBottom: 24 + insets.bottom },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Vendor hub</Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={C.slate400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders"
            placeholderTextColor={C.slate400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable style={styles.bellWrap} hitSlop={8}>
          <Ionicons name="notifications-outline" size={24} color={C.slate700} />
          {notificationCount > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={[styles.statsGrid, !wide && styles.statsGridNarrow]}>
        <StatCard
          title="Orders today"
          value={String(stats.totalToday)}
          icon="today-outline"
          accent={C.cyan600}
        />
        <StatCard
          title="Pending"
          value={String(stats.pending)}
          icon="hourglass-outline"
          accent={C.amber600}
        />
        <StatCard
          title="Completed"
          value={String(stats.completed)}
          icon="checkmark-done-outline"
          accent={C.emerald600}
        />
        <StatCard
          title="Revenue (KES)"
          value={formatKes(stats.revenue)}
          icon="wallet-outline"
          accent={C.indigo600}
        />
        <StatCard
          title="Popular items"
          value={stats.popularItems || '—'}
          icon="flame-outline"
          accent={C.cyan600}
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Vendor promotions · Campaigns</Text>
        <View style={styles.inlineRow}>
          <TextInput
            style={[styles.inlineInput, { flex: 1 }]}
            placeholder="Code"
            value={campaignCode}
            onChangeText={setCampaignCode}
          />
          <TextInput
            style={[styles.inlineInput, { width: 96 }]}
            placeholder="%"
            keyboardType="numeric"
            value={campaignDiscount}
            onChangeText={setCampaignDiscount}
          />
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={createCampaign}>
            <Text style={styles.btnTxt}>Create</Text>
          </Pressable>
        </View>
        {campaigns.map((c) => (
          <Text key={c.code} style={styles.simpleLine}>
            {c.code} · {c.discount}% off
          </Text>
        ))}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>External API integration</Text>
        <Pressable style={[styles.btn, styles.btnPrimary]} onPress={importExternalOrder}>
          <Text style={styles.btnTxt}>POST /external/orders (mock)</Text>
        </Pressable>
        {externalSyncMessage ? <Text style={styles.simpleLine}>{externalSyncMessage}</Text> : null}
      </View>

      {navActive === 'products' ? (
        <View style={styles.sectionCard}>
          <View style={styles.orderTop}>
            <Text style={styles.sectionTitle}>Products & inventory</Text>
            <Pressable style={[styles.btn, styles.btnOk]} onPress={addProduct}>
              <Text style={styles.btnTxt}>Add</Text>
            </Pressable>
          </View>
          {products.map((p) => (
            <View key={p.id} style={styles.productRow}>
              <TextInput
                style={[styles.inlineInput, { flex: 1 }]}
                value={p.name}
                onChangeText={(v) => updateProduct(p.id, { name: v })}
              />
              <TextInput
                style={[styles.inlineInput, { width: 92 }]}
                value={String(p.stock)}
                keyboardType="numeric"
                onChangeText={(v) => updateProduct(p.id, { stock: Number(v) || 0 })}
              />
              <Pressable
                style={[styles.btn, p.isDarkStore ? styles.btnOk : styles.btnPrimary]}
                onPress={() => updateProduct(p.id, { isDarkStore: !p.isDarkStore })}
              >
                <Text style={styles.btnTxt}>{p.isDarkStore ? 'Dark' : 'Store'}</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => removeProduct(p.id)}>
                <Text style={styles.btnTxt}>Del</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <OrderTable
        orders={orders}
        search={search}
        onAccept={handleAccept}
        onReject={handleReject}
        onReady={handleReady}
        onDispatch={handleDispatch}
        onDeliver={handleDeliver}
      />
    </ScrollView>
  )

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {wide ? (
        <View style={styles.row}>
          <Sidebar
            wide
            active={navActive}
            onNav={handleNav}
            notificationCount={notificationCount}
          />
          <View style={styles.mainPane}>{mainContent}</View>
        </View>
      ) : (
        <View style={styles.col}>
          <Sidebar wide={false} active={navActive} onNav={handleNav} notificationCount={notificationCount} />
          {mainContent}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.slate100 },
  row: { flex: 1, flexDirection: 'row' },
  col: { flex: 1 },
  mainPane: { flex: 1, minWidth: 0 },
  mainScroll: { flex: 1 },
  mainInner: { paddingHorizontal: 16, paddingTop: 16 },
  sidebarWide: {
    width: 232,
    backgroundColor: C.white,
    borderRightWidth: 1,
    borderRightColor: C.slate200,
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  sidebarCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  brandBlock: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24, paddingHorizontal: 4 },
  brandInline: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8 },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.cyan600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 20 },
  brandTitle: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  brandTitleSm: { fontSize: 14, fontWeight: '800', color: C.slate900 },
  brandSub: { fontSize: 12, color: C.slate500 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemWide: { width: '100%' },
  navItemActive: { backgroundColor: K.greenMuted },
  navLabel: { fontSize: 15, fontWeight: '600', color: C.slate600, flex: 1 },
  navLabelActive: { color: C.cyan600 },
  badge: {
    backgroundColor: C.rose600,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: C.white, fontSize: 11, fontWeight: '800' },
  topBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  pageTitle: { fontSize: 24, fontWeight: '800', color: C.slate900, flex: 1, minWidth: 160 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
    maxWidth: 360,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: C.slate900 },
  bellWrap: { position: 'relative', padding: 8 },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: C.rose600,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: C.white, fontSize: 10, fontWeight: '800' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statsGridNarrow: { flexDirection: 'column' },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 140,
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: C.slate200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statTitle: { fontSize: 13, fontWeight: '600', color: C.slate500 },
  statValue: { fontSize: 22, fontWeight: '800', color: C.slate900 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.slate900,
    marginBottom: 12,
  },
  tableWrap: { marginTop: 4 },
  sectionCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.slate200,
    padding: 14,
    marginBottom: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  inlineInput: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    fontSize: 14,
    color: C.slate900,
    backgroundColor: C.slate50,
  },
  simpleLine: {
    marginTop: 6,
    fontSize: 13,
    color: C.slate600,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyTable: { color: C.slate500, padding: 24, textAlign: 'center' },
  orderCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 15, fontWeight: '800', color: C.slate900 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  customer: { fontSize: 15, fontWeight: '600', color: C.slate800, marginTop: 8 },
  items: { fontSize: 13, color: C.slate600, marginTop: 4 },
  orderAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: K.green,
    marginTop: 8,
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    alignItems: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 4,
  },
  btnTxt: { color: C.white, fontWeight: '700', fontSize: 13 },
  btnOk: { backgroundColor: C.emerald600 },
  btnDanger: { backgroundColor: C.rose600 },
  btnPrimary: { backgroundColor: K.green },
  doneHint: { fontSize: 13, color: C.emerald600, fontWeight: '700' },
})
