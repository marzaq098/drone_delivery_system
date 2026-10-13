import React, { useMemo } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCart } from '../context/CartContext'
import { formatKes } from '../constants/kenyaBrand'
import { getRestaurantById, menuItemToProduct } from '../constants/foodMock'

const C = {
  cyan600: '#22d3ee',
  indigo600: '#4f46e5',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  white: '#ffffff',
}

export default function RestaurantPage({ restaurantId }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const { addToCart } = useCart()
  const maxW = Math.min(560, width - 32)

  const restaurant = useMemo(() => getRestaurantById(restaurantId), [restaurantId])

  if (!restaurant) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={C.slate800} />
          </Pressable>
          <Text style={styles.topTitle}>Restaurant</Text>
          <View style={styles.backBtn} />
        </View>
        <Text style={styles.miss}>Restaurant not found.</Text>
      </View>
    )
  }

  function handleAdd(item) {
    addToCart(menuItemToProduct(restaurant, item))
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Image source={{ uri: restaurant.image }} style={styles.heroImg} resizeMode="cover" />
        <View style={styles.heroGrad} />
        <Pressable style={[styles.heroBack, { top: insets.top + 8 }]} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.white} />
        </Pressable>
        <View style={[styles.heroText, { paddingBottom: 16 }]}>
          <Text style={styles.heroName}>{restaurant.name}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroMeta}>⭐ {restaurant.rating}</Text>
            <Text style={styles.heroMeta}>{restaurant.deliveryMins} min</Text>
            <Text style={styles.heroMeta}>{formatKes(restaurant.deliveryFee)} fee</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: 24 + insets.bottom, maxWidth: maxW, alignSelf: 'center' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {restaurant.menu.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item.key} style={styles.row}>
                <Image source={{ uri: item.image }} style={styles.thumb} />
                <View style={styles.rowMid}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <Text style={styles.itemPrice}>{formatKes(item.price)}</Text>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.addCircle, pressed && styles.pressed]}
                  onPress={() => handleAdd(item)}
                  accessibilityLabel={`Add ${item.name}`}
                >
                  <Ionicons name="add" size={26} color={C.indigo600} />
                </Pressable>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#eef4ff' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: C.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: C.slate900 },
  miss: { padding: 24, fontSize: 15, color: C.slate600 },
  hero: { height: 200, position: 'relative' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroGrad: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  heroBack: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.35)',
  },
  heroText: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  heroName: { fontSize: 22, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  heroRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  heroMeta: { fontSize: 13, fontWeight: '700', color: '#e2e8f0' },
  scroll: { flex: 1 },
  scrollInner: { width: '100%', paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.slate900,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  thumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#e2e8f0' },
  rowMid: { flex: 1, minWidth: 0 },
  itemName: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  itemDesc: { fontSize: 12, color: C.slate600, marginTop: 4, lineHeight: 16 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: C.indigo600, marginTop: 6 },
  addCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: C.indigo600,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  pressed: { opacity: 0.88 },
})
