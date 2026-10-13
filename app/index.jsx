import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRole } from '../context/RoleContext'
import { K } from '../constants/kenyaBrand'

const ROLES = [
  {
    id: 'customer',
    title: 'Customer',
    subtitle: 'Shop & track',
    description: 'Shop Nairobi vendors, track parcels, and pay with M-Pesa.',
    icon: 'person',
    emoji: '👤',
  },
  {
    id: 'vendor',
    title: 'Vendor',
    subtitle: 'Sell & fulfill',
    description: 'Manage orders, dispatch drones, and grow your storefront.',
    icon: 'storefront',
    emoji: '🧑‍💼',
  },
  {
    id: 'fleet',
    title: 'Fleet Manager',
    subtitle: 'Ops & routes',
    description: 'Monitor drones, routes, and fleet health across the city.',
    icon: 'airplane',
    emoji: '🚁',
  },
]

export default function LandingPage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { role, ready } = useRole()

  const isWide = width >= 720
  const cardBasis = isWide ? '31%' : '100%'

  useEffect(() => {
    if (!ready) return
    if (!role) return
    if (role === 'customer') router.replace('/dashboard')
    else if (role === 'vendor') router.replace('/vendor')
    else if (role === 'fleet') router.replace('/fleet')
  }, [ready, role, router])

  function continueAs(roleId) {
    router.push({ pathname: '/login', params: { role: roleId } })
  }

  if (!ready) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={K.green} />
        <Text style={styles.loadingHint}>Loading…</Text>
      </View>
    )
  }

  if (role) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={K.green} />
        <Text style={styles.loadingHint}>Opening your workspace…</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.hero}>
        <View style={styles.logoMark}>
          <Text style={styles.logoEmoji}>✈</Text>
        </View>
        <Text style={styles.heroTitle}>Quantum Drop Drone</Text>
        <Text style={styles.heroTag}>Nairobi · Multi-role access</Text>
        <Text style={styles.heroBody}>
          Choose how you use the app. You can sign in or create an account for your role — session persists
          after refresh (stored on device).
        </Text>
      </View>

      <View style={[styles.grid, isWide && styles.gridWide]}>
        {ROLES.map((r) => (
          <View key={r.id} style={[styles.card, { minWidth: isWide ? 200 : undefined, flexBasis: cardBasis }]}>
            <Text style={styles.cardEmoji}>{r.emoji}</Text>
            <View style={styles.cardTitleRow}>
              <Ionicons name={r.icon} size={22} color={K.green} />
              <Text style={styles.cardTitle}>{r.title}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{r.subtitle}</Text>
            <Text style={styles.cardDesc}>{r.description}</Text>
            <Pressable
              style={({ pressed }) => [styles.continueBtn, pressed && styles.pressed]}
              onPress={() => continueAs(r.id)}
              accessibilityRole="button"
              accessibilityLabel={`Continue as ${r.title}`}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
            <Pressable
              style={styles.registerLink}
              onPress={() => router.push({ pathname: '/register', params: { role: r.id } })}
            >
              <Text style={styles.registerLinkText}>New here? Register as {r.title}</Text>
            </Pressable>
          </View>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: K.sand,
  },
  scrollInner: {
    paddingHorizontal: 18,
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: K.sand,
  },
  loadingHint: {
    marginTop: 12,
    fontSize: 14,
    color: K.slate600,
    fontWeight: '600',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: K.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: K.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  logoEmoji: { fontSize: 28 },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: K.black,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  heroTag: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: K.green,
  },
  heroBody: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 21,
    color: K.slate600,
    textAlign: 'center',
    maxWidth: 520,
  },
  grid: {
    gap: 16,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 3 },
    }),
  },
  cardEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: K.black,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: K.slate500,
    marginTop: 2,
    marginBottom: 10,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: K.slate600,
    marginBottom: 16,
    minHeight: 60,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: K.green,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pressed: { opacity: 0.9 },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  registerLink: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  registerLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: K.green,
  },
})
