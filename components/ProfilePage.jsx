/**
 * Quantum Drop Drone — User Profile (Expo / React Native)
 *
 * Single-file profile screen: header, editable form, password, role stats,
 * settings (mock dark mode, notifications), logout.
 * Persists to AsyncStorage (localStorage equivalent on native / web).
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Switch,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { K } from '../constants/kenyaBrand'
import { useRole } from '../context/RoleContext'
import { getAuthSession } from '../lib/authSession'
import { routeForRole } from '../lib/roleRouting'

const STORAGE_PROFILE = '@qdd/profile'
const STORAGE_SETTINGS = '@qdd/settings'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLE_TITLE = {
  customer: 'Customer',
  vendor: 'Vendor',
  fleet: 'Fleet Manager',
}

/** @typedef {'customer' | 'vendor' | 'fleet'} UserRole */

function defaultProfile(/** @type {UserRole} */ role) {
  return {
    fullName: role === 'vendor' ? 'Juma Hardware Ltd' : role === 'fleet' ? 'Njeri Kamau' : 'Wanjiku Muthoni',
    email: 'hello@quantumdrop.ke',
    phone: '+254 712 345 678',
    address:
      role === 'customer'
        ? 'Kilimani, Argwings Kodhek Rd, Nairobi'
        : role === 'vendor'
          ? 'Industrial Area, Godown 12, Nairobi'
          : 'Karen Hub, Flight Ops, Nairobi',
    businessName: role === 'vendor' ? 'Juma Hardware & Supplies' : '',
    avatarUri: null,
  }
}

function defaultRoleStats(/** @type {UserRole} */ role) {
  if (role === 'customer') {
    return { totalOrders: 24, savedAddresses: 3 }
  }
  if (role === 'vendor') {
    return { businessName: 'Juma Hardware & Supplies', totalProducts: 48, ordersReceived: 156 }
  }
  return { assignedDrones: 6, activeDeliveries: 4 }
}

function defaultSettings() {
  return {
    darkMode: false,
    notifications: true,
  }
}

async function loadJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return fallback
    return { ...fallback, ...JSON.parse(raw) }
  } catch {
    return fallback
  }
}

async function saveJson(key, value) {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

function ProfileHeader({ profile, role, avatarUri }) {
  const roleLabel = ROLE_TITLE[role] || ROLE_TITLE.customer

  return (
    <View style={phStyles.wrap}>
      <View style={phStyles.avatarRing}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={phStyles.avatarImg} />
        ) : (
          <View style={phStyles.avatarPlaceholder}>
            <Ionicons name="person" size={44} color={K.green} />
          </View>
        )}
      </View>
      <Text style={phStyles.name}>{profile.fullName}</Text>
      <Text style={phStyles.email}>{profile.email}</Text>
      <View style={phStyles.rolePill}>
        <Ionicons name="shield-checkmark" size={14} color={K.green} />
        <Text style={phStyles.roleText}>{roleLabel}</Text>
      </View>
    </View>
  )
}

const phStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 20 },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: K.green,
    marginBottom: 12,
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: K.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, fontWeight: '800', color: K.black, textAlign: 'center' },
  email: { fontSize: 14, color: K.slate600, marginTop: 4 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: K.greenMuted,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  roleText: { fontSize: 13, fontWeight: '700', color: K.green },
})

function RoleStatsSection({ role, stats }) {
  if (role === 'customer') {
    return (
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Activity</Text>
        <View style={cardStyles.row}>
          <View style={cardStyles.statBox}>
            <Ionicons name="cube-outline" size={22} color={K.green} />
            <Text style={cardStyles.statVal}>{stats.totalOrders}</Text>
            <Text style={cardStyles.statLbl}>Total orders</Text>
          </View>
          <View style={cardStyles.statBox}>
            <Ionicons name="location-outline" size={22} color={K.green} />
            <Text style={cardStyles.statVal}>{stats.savedAddresses}</Text>
            <Text style={cardStyles.statLbl}>Saved addresses</Text>
          </View>
        </View>
      </View>
    )
  }

  if (role === 'vendor') {
    return (
      <View style={cardStyles.card}>
        <Text style={cardStyles.cardTitle}>Business</Text>
        <Text style={cardStyles.bizName}>{stats.businessName}</Text>
        <View style={cardStyles.row}>
          <View style={cardStyles.statBox}>
            <Ionicons name="pricetags-outline" size={22} color={K.green} />
            <Text style={cardStyles.statVal}>{stats.totalProducts}</Text>
            <Text style={cardStyles.statLbl}>Products</Text>
          </View>
          <View style={cardStyles.statBox}>
            <Ionicons name="receipt-outline" size={22} color={K.green} />
            <Text style={cardStyles.statVal}>{stats.ordersReceived}</Text>
            <Text style={cardStyles.statLbl}>Orders received</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.cardTitle}>Fleet operations</Text>
      <View style={cardStyles.row}>
        <View style={cardStyles.statBox}>
          <Ionicons name="airplane-outline" size={22} color={K.green} />
          <Text style={cardStyles.statVal}>{stats.assignedDrones}</Text>
          <Text style={cardStyles.statLbl}>Assigned drones</Text>
        </View>
        <View style={cardStyles.statBox}>
          <Ionicons name="navigate-circle-outline" size={22} color={K.green} />
          <Text style={cardStyles.statVal}>{stats.activeDeliveries}</Text>
          <Text style={cardStyles.statLbl}>Active deliveries</Text>
        </View>
      </View>
    </View>
  )
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: K.black, marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: K.sand,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: { fontSize: 22, fontWeight: '800', color: K.black, marginTop: 6 },
  statLbl: { fontSize: 11, color: K.slate600, marginTop: 4, textAlign: 'center' },
  bizName: { fontSize: 15, fontWeight: '700', color: K.green, marginBottom: 12 },
})

function ActivitySummary() {
  const lines = [
    'Today: order dispatched → Westlands',
    'Yesterday: payment KSh 1,890 · M-Pesa',
    'This week: 12 orders tracked',
  ]
  return (
    <View style={actStyles.card}>
      <View style={actStyles.head}>
        <Ionicons name="pulse" size={20} color={K.green} />
        <Text style={actStyles.title}>Activity summary</Text>
      </View>
      {lines.map((line, i) => (
        <Text key={i} style={actStyles.line}>
          • {line}
        </Text>
      ))}
    </View>
  )
}

const actStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '800', color: K.black },
  line: { fontSize: 13, color: K.slate600, lineHeight: 20, marginBottom: 6 },
})

function SettingsSection({ settings, onChange }) {
  return (
    <View style={setStyles.card}>
      <Text style={setStyles.cardTitle}>Settings</Text>
      <View style={setStyles.row}>
        <View style={setStyles.rowLeft}>
          <Ionicons name="moon-outline" size={20} color={K.slate600} />
          <Text style={setStyles.lbl}>Dark mode (mock)</Text>
        </View>
        <Switch
          value={settings.darkMode}
          onValueChange={(v) => onChange({ ...settings, darkMode: v })}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={settings.darkMode ? K.green : '#f4f4f5'}
        />
      </View>
      <View style={setStyles.row}>
        <View style={setStyles.rowLeft}>
          <Ionicons name="notifications-outline" size={20} color={K.slate600} />
          <Text style={setStyles.lbl}>Notifications</Text>
        </View>
        <Switch
          value={settings.notifications}
          onValueChange={(v) => onChange({ ...settings, notifications: v })}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={settings.notifications ? K.green : '#f4f4f5'}
        />
      </View>
    </View>
  )
}

const setStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: K.black, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  lbl: { fontSize: 15, fontWeight: '600', color: K.slate800 },
})

export default function ProfilePage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { role: ctxRole, clearRole } = useRole()
  const role = ctxRole || 'customer'

  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profile, setProfile] = useState(() => defaultProfile(role))
  const [form, setForm] = useState(() => defaultProfile(role))
  const [roleStats, setRoleStats] = useState(() => defaultRoleStats(role))
  const [settings, setSettings] = useState(defaultSettings)
  const [banner, setBanner] = useState(null)

  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [pwdErrors, setPwdErrors] = useState({})

  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [p, rawS] = await Promise.all([
        loadJson(STORAGE_PROFILE, defaultProfile(role)),
        loadJson(STORAGE_SETTINGS, defaultSettings()),
      ])
      const session = await getAuthSession()
      if (cancelled) return
      let next = { ...defaultProfile(role), ...p }
      if (session.user) {
        if (session.user.fullName) next.fullName = session.user.fullName
        if (session.user.email) next.email = session.user.email
        await saveJson(STORAGE_PROFILE, next)
      }
      setProfile(next)
      setForm(next)
      setRoleStats(defaultRoleStats(role))
      setSettings({
        darkMode: !!rawS.darkMode,
        notifications: rawS.notifications !== false,
      })
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [role])

  const persistProfile = useCallback(async (next) => {
    setProfile(next)
    await saveJson(STORAGE_PROFILE, next)
  }, [])

  const persistSettings = useCallback(async (next) => {
    setSettings(next)
    await saveJson(STORAGE_SETTINGS, next)
  }, [])

  const validateForm = useCallback(() => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!emailRegex.test(form.email.trim())) e.email = 'Invalid email'
    if ((role === 'customer' || role === 'vendor') && !form.address.trim()) {
      e.address = 'Address is required'
    }
    if (role === 'vendor' && !form.businessName.trim()) {
      e.businessName = 'Business name is required'
    }
    return e
  }, [form, role])

  function handleSaveProfile() {
    const e = validateForm()
    setFormErrors(e)
    if (Object.keys(e).length) return
    persistProfile({ ...form })
    setEditMode(false)
    setBanner('Profile saved (mock)')
    setTimeout(() => setBanner(null), 2800)
  }

  function mockAvatarUpload() {
    const uri =
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&auto=format&q=80'
    setForm((f) => {
      const next = { ...f, avatarUri: uri }
      persistProfile(next)
      return next
    })
    setBanner('Photo updated (mock)')
    setTimeout(() => setBanner(null), 2200)
  }

  const validatePwd = () => {
    const e = {}
    if (!pwd.current) e.current = 'Enter current password'
    if (!pwd.next || pwd.next.length < 6) e.next = 'Use at least 6 characters'
    if (pwd.next !== pwd.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  function handleUpdatePassword() {
    const e = validatePwd()
    setPwdErrors(e)
    if (Object.keys(e).length) return
    setPwd({ current: '', next: '', confirm: '' })
    setPwdErrors({})
    setBanner('Password updated (mock)')
    setTimeout(() => setBanner(null), 2800)
  }

  async function handleLogout() {
    await AsyncStorage.multiRemove([STORAGE_PROFILE, STORAGE_SETTINGS])
    await clearRole()
    router.replace('/')
  }

  const backLabel = 'Back to dashboard'

  const maxW = Math.min(560, width - 32)

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={K.green} />
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.inner, { maxWidth: maxW }]}>
          <Pressable style={styles.backRow} onPress={() => router.replace(routeForRole(role))} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color={K.green} />
            <Text style={styles.backTxt}>{backLabel}</Text>
          </Pressable>

          <Text style={styles.pageTitle}>Profile</Text>
          <Text style={styles.pageSub}>Quantum Drop Drone · Nairobi · KES / M-Pesa</Text>

          {banner ? (
            <View style={styles.banner}>
              <Ionicons name="checkmark-circle" size={18} color={K.green} />
              <Text style={styles.bannerTxt}>{banner}</Text>
            </View>
          ) : null}

          <ProfileHeader profile={profile} role={role} avatarUri={profile.avatarUri} />

          <Pressable style={styles.mockUpload} onPress={mockAvatarUpload}>
            <Ionicons name="camera-outline" size={18} color={K.green} />
            <Text style={styles.mockUploadTxt}>Change photo (mock)</Text>
          </Pressable>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Details</Text>
              <Pressable
                style={styles.editBtn}
                onPress={() => {
                  if (editMode) {
                    setForm({ ...profile })
                    setFormErrors({})
                    setEditMode(false)
                  } else setEditMode(true)
                }}
              >
                <Text style={styles.editBtnTxt}>{editMode ? 'Cancel' : 'Edit profile'}</Text>
              </Pressable>
            </View>

            <Text style={styles.lbl}>Full name</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={form.fullName}
              editable={editMode}
              onChangeText={(t) => setForm((f) => ({ ...f, fullName: t }))}
              placeholderTextColor="#94a3b8"
            />
            {formErrors.fullName ? <Text style={styles.err}>{formErrors.fullName}</Text> : null}

            <Text style={styles.lbl}>Email</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={form.email}
              editable={editMode}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(t) => setForm((f) => ({ ...f, email: t }))}
              placeholderTextColor="#94a3b8"
            />
            {formErrors.email ? <Text style={styles.err}>{formErrors.email}</Text> : null}

            <Text style={styles.lbl}>Phone</Text>
            <TextInput
              style={[styles.input, !editMode && styles.inputDisabled]}
              value={form.phone}
              editable={editMode}
              keyboardType="phone-pad"
              onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
              placeholderTextColor="#94a3b8"
            />

            {(role === 'customer' || role === 'vendor') && (
              <>
                <Text style={styles.lbl}>Address</Text>
                <TextInput
                  style={[styles.input, styles.inputMulti, !editMode && styles.inputDisabled]}
                  value={form.address}
                  editable={editMode}
                  multiline
                  onChangeText={(t) => setForm((f) => ({ ...f, address: t }))}
                  placeholderTextColor="#94a3b8"
                />
                {formErrors.address ? <Text style={styles.err}>{formErrors.address}</Text> : null}
              </>
            )}

            {role === 'vendor' && (
              <>
                <Text style={styles.lbl}>Business name</Text>
                <TextInput
                  style={[styles.input, !editMode && styles.inputDisabled]}
                  value={form.businessName}
                  editable={editMode}
                  onChangeText={(t) => setForm((f) => ({ ...f, businessName: t }))}
                  placeholderTextColor="#94a3b8"
                />
                {formErrors.businessName ? <Text style={styles.err}>{formErrors.businessName}</Text> : null}
              </>
            )}

            {editMode ? (
              <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
                <Text style={styles.saveBtnTxt}>Save changes</Text>
              </Pressable>
            ) : null}
          </View>

          <RoleStatsSection role={role} stats={roleStats} />
          <ActivitySummary />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change password</Text>
            <Text style={styles.lbl}>Current password</Text>
            <TextInput
              style={styles.input}
              value={pwd.current}
              secureTextEntry
              onChangeText={(t) => setPwd((p) => ({ ...p, current: t }))}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
            />
            {pwdErrors.current ? <Text style={styles.err}>{pwdErrors.current}</Text> : null}

            <Text style={styles.lbl}>New password</Text>
            <TextInput
              style={styles.input}
              value={pwd.next}
              secureTextEntry
              onChangeText={(t) => setPwd((p) => ({ ...p, next: t }))}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
            />
            {pwdErrors.next ? <Text style={styles.err}>{pwdErrors.next}</Text> : null}

            <Text style={styles.lbl}>Confirm password</Text>
            <TextInput
              style={styles.input}
              value={pwd.confirm}
              secureTextEntry
              onChangeText={(t) => setPwd((p) => ({ ...p, confirm: t }))}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
            />
            {pwdErrors.confirm ? <Text style={styles.err}>{pwdErrors.confirm}</Text> : null}

            <Pressable style={styles.pwdBtn} onPress={handleUpdatePassword}>
              <Text style={styles.pwdBtnTxt}>Update password</Text>
            </Pressable>
          </View>

          <SettingsSection settings={settings} onChange={persistSettings} />

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.logoutTxt}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: K.sand },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { alignItems: 'center', paddingHorizontal: 16 },
  inner: { width: '100%', alignSelf: 'center' },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backTxt: { fontSize: 15, fontWeight: '700', color: K.green },
  pageTitle: { fontSize: 26, fontWeight: '800', color: K.black, letterSpacing: -0.4 },
  pageSub: { fontSize: 13, color: K.slate600, marginTop: 4, marginBottom: 12 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: K.greenMuted,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginBottom: 14,
    width: '100%',
  },
  bannerTxt: { flex: 1, fontSize: 13, fontWeight: '600', color: K.slate800 },
  mockUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  mockUploadTxt: { fontSize: 14, fontWeight: '700', color: K.green },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: K.black },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: K.green,
    backgroundColor: K.greenMuted,
  },
  editBtnTxt: { fontSize: 13, fontWeight: '800', color: K.green },
  lbl: { fontSize: 12, fontWeight: '700', color: K.slate600, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 15,
    color: K.black,
    backgroundColor: '#fafafa',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  inputDisabled: { backgroundColor: '#f1f5f9', color: K.slate600 },
  err: { fontSize: 12, color: K.red, marginTop: 4, fontWeight: '600' },
  saveBtn: {
    marginTop: 18,
    backgroundColor: K.green,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  pwdBtn: {
    marginTop: 14,
    backgroundColor: K.black,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  pwdBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: K.red,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  logoutTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
})
