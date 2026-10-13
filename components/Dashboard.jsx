import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  useWindowDimensions,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCart } from '../context/CartContext'
import { K, formatKes } from '../constants/kenyaBrand'
import { FOOD_CUISINES, MOCK_RESTAURANTS } from '../constants/foodMock'
import GroceryBrowse from './GroceryBrowse'
import PharmacyBrowse from './PharmacyBrowse'
import { getProductsApi, getVendorsApi } from '../api/catalog'

const SHOP_MODES = [
  { id: 'food', label: 'Food', navTitle: 'Quantum Drop · Food', search: 'Search for restaurants or food' },
  { id: 'groceries', label: 'Groceries', navTitle: 'Quantum Drop · Groceries', search: 'Search groceries…' },
  { id: 'pharmacy', label: 'Pharmacy', navTitle: 'Quantum Drop · Pharmacy', search: 'Search medicines…' },
]

const C = {
  cyan600: '#22d3ee',
  cyan700: '#0891b2',
  indigo600: '#4f46e5',
  navy950: '#070b1a',
  navy900: '#0f172a',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#dbe4ef',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  rose500: K.red,
  white: '#ffffff',
}

function Navbar({ searchQuery, onSearchChange, topInset, navTitle, searchPlaceholder, searchAccessibilityLabel }) {
  return (
    <View style={[styles.navOuter, { paddingTop: topInset }]}>
      <View style={styles.navInner}>
        <View style={styles.navBrand}>
          <View style={styles.logoMark}>
            <Text style={styles.logoEmoji}>✈</Text>
          </View>
          <Text style={styles.navTitleFull} numberOfLines={2}>
            {navTitle}
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={C.slate500} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={C.slate500}
            style={styles.searchInput}
            accessibilityLabel={searchAccessibilityLabel || searchPlaceholder}
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel="User profile"
        >
          <Ionicons name="person-outline" size={22} color={C.slate600} />
        </Pressable>
      </View>
    </View>
  )
}

function RestaurantCard({ restaurant, onPress, cardStyle }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.restCard, cardStyle, pressed && styles.pressed]}
    >
      <View style={styles.restImgWrap}>
        <Image source={{ uri: restaurant.image }} style={styles.restImg} resizeMode="cover" />
        <View style={styles.restRatingPill}>
          <Ionicons name="star" size={12} color="#f59e0b" />
          <Text style={styles.restRatingPillTxt}>{restaurant.rating}</Text>
        </View>
      </View>
      <View style={styles.restBody}>
        <Text style={styles.restName} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <View style={styles.restMetaRow}>
          <View style={styles.restMetaChip}>
            <Ionicons name="time-outline" size={12} color={C.slate600} />
            <Text style={styles.restMeta}>{restaurant.deliveryMins} min</Text>
          </View>
          <View style={styles.restMetaChip}>
            <Ionicons name="paper-plane-outline" size={12} color={C.slate600} />
            <Text style={styles.restMeta}>{formatKes(restaurant.deliveryFee)} delivery</Text>
          </View>
        </View>
        <View style={styles.restChev}>
          <Text style={styles.restOpen}>View menu</Text>
          <Ionicons name="chevron-forward" size={18} color={C.indigo600} />
        </View>
      </View>
    </Pressable>
  )
}

function QuickActions() {
  const router = useRouter()
  return (
    <View style={styles.quickWrap}>
      <Pressable style={styles.quickBtn} onPress={() => router.push('/order')}>
        <Ionicons name="send-outline" size={18} color={C.cyan600} />
        <Text style={styles.quickBtnTxt}>Send Package</Text>
      </Pressable>
      <Pressable style={styles.quickBtn} onPress={() => router.push('/tracking')}>
        <Ionicons name="navigate-circle-outline" size={18} color={C.cyan600} />
        <Text style={styles.quickBtnTxt}>Track Drone</Text>
      </Pressable>
    </View>
  )
}

function RestaurantSkeleton() {
  return (
    <View style={styles.restCard}>
      <View style={[styles.restImgWrap, styles.skeletonBlock]} />
      <View style={styles.restBody}>
        <View style={[styles.skeletonLine, { width: '70%' }]} />
        <View style={[styles.skeletonLine, { width: '90%', marginTop: 10 }]} />
        <View style={[styles.skeletonLine, { width: '40%', marginTop: 12 }]} />
      </View>
    </View>
  )
}

function groupCartLines(items) {
  const order = []
  const map = new Map()
  for (const line of items) {
    const p = line.product
    let key
    let title
    if (p.storeType === 'grocery' || p.groceryStoreName) {
      key = 'grocery'
      title = `Groceries · ${p.groceryStoreName || 'Store'}`
    } else if (p.storeType === 'pharmacy' || p.pharmacyName) {
      key = 'pharmacy'
      title = `Pharmacy · ${p.pharmacyName || 'Store'}`
    } else {
      key = `food:${p.restaurantId ?? 'r'}`
      title = p.restaurantName || 'Food'
    }
    if (!map.has(key)) {
      map.set(key, { key, title, lines: [] })
      order.push(key)
    }
    map.get(key).lines.push(line)
  }
  return order.map((k) => map.get(k))
}

function CartModal({ open, onClose, items, onRemoveLine, onAdjustQty, cartCount, cartTotal, onCheckout }) {
  const sections = useMemo(() => groupCartLines(items), [items])
  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} accessibilityLabel="Close cart overlay" />
        <View style={styles.cartSheet}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>
              Your order
              {cartCount > 0 ? (
                <Text style={styles.cartSubtitle}> ({cartCount})</Text>
              ) : null}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close cart">
              <Ionicons name="close" size={22} color={C.slate500} />
            </Pressable>
          </View>

          <ScrollView style={styles.cartScroll} contentContainerStyle={styles.cartScrollContent}>
            {items.length === 0 ? (
              <View style={styles.emptyCart}>
                <Text style={styles.emptyEmoji}>🧺</Text>
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptyHint}>
                  Browse Food, Groceries, or Pharmacy — add items and your cart updates live.
                </Text>
              </View>
            ) : (
              sections.map((sec) => (
                <View key={sec.key} style={styles.cartSection}>
                  <Text style={styles.cartSectionTitle}>{sec.title}</Text>
                  {sec.lines.map((line) => (
                    <View key={line.product.id} style={styles.cartLine}>
                      <Image source={{ uri: line.product.image }} style={styles.cartThumb} />
                      <View style={styles.cartLineMid}>
                        <Text style={styles.cartLineName} numberOfLines={2}>
                          {line.product.name}
                        </Text>
                        {line.product.requiresPrescription ? (
                          <Text style={styles.cartRx}>Rx required</Text>
                        ) : null}
                        {line.product.restaurantName && line.product.storeType !== 'grocery' && line.product.storeType !== 'pharmacy' ? (
                          <Text style={styles.cartRest} numberOfLines={1}>
                            {line.product.restaurantName}
                          </Text>
                        ) : null}
                        <Text style={styles.cartLineMeta}>{formatKes(line.product.price)} each</Text>
                        <View style={styles.qtyRow}>
                          <Pressable
                            style={styles.qtyBtn}
                            onPress={() => onAdjustQty(line.product.id, -1)}
                            accessibilityLabel="Decrease quantity"
                          >
                            <Ionicons name="remove" size={18} color={C.indigo600} />
                          </Pressable>
                          <Text style={styles.qtyVal}>{line.qty}</Text>
                          <Pressable
                            style={styles.qtyBtn}
                            onPress={() => onAdjustQty(line.product.id, 1)}
                            accessibilityLabel="Increase quantity"
                          >
                            <Ionicons name="add" size={18} color={C.indigo600} />
                          </Pressable>
                          <Pressable onPress={() => onRemoveLine(line.product.id)} style={styles.removePress}>
                            <Text style={styles.removeLink}>Remove</Text>
                          </Pressable>
                        </View>
                      </View>
                      <Text style={styles.cartLineTotal}>{formatKes(line.product.price * line.qty)}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {items.length > 0 ? (
            <View style={styles.cartFooter}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>{formatKes(cartTotal)}</Text>
              </View>
              <Pressable style={styles.checkoutBtn} onPress={onCheckout}>
                <Text style={styles.checkoutBtnText}>Go to checkout</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { cartItems, addToCart, removeLine, adjustQty } = useCart()
  const [loading, setLoading] = useState(true)
  const [shopMode, setShopMode] = useState('food')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState(null)
  const [selectedGroceryAisle, setSelectedGroceryAisle] = useState('All')
  const [selectedPharmaCategory, setSelectedPharmaCategory] = useState('All')
  const [cartOpen, setCartOpen] = useState(false)
  const [remoteRestaurants, setRemoteRestaurants] = useState([])
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const fabScale = useRef(new Animated.Value(1)).current
  const prevCount = useRef(0)

  const modeConfig = SHOP_MODES.find((m) => m.id === shopMode) || SHOP_MODES[0]

  useEffect(() => {
    setSearchQuery('')
  }, [shopMode])

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [vendors, products] = await Promise.all([getVendorsApi(), getProductsApi()])
        if (cancelled) return
        const foodVendors = (vendors || []).filter((v) => v.type === 'food')
        const merged = foodVendors.map((v) => {
          const fallback = MOCK_RESTAURANTS.find((r) => r.id === v.id)
          const vp = (products || []).filter((p) => p.vendorId === v.id)
          return {
            id: v.id,
            name: v.name,
            rating: fallback?.rating ?? 4.5,
            image: fallback?.image ?? 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=600&h=400&fit=crop',
            deliveryMins: fallback?.deliveryMins ?? 20,
            deliveryFee: fallback?.deliveryFee ?? 120,
            cuisines: fallback?.cuisines ?? ['Fast Food'],
            menu: fallback?.menu ?? [{ title: 'Menu', items: vp.map((p) => ({ key: p.id, name: p.name, description: p.category, price: p.price, image: fallback?.image })) }],
          }
        })
        setRemoteRestaurants(merged)
      } catch {
        // Keep mock restaurants if API is unavailable.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredRestaurants = useMemo(() => {
    const source = remoteRestaurants.length > 0 ? remoteRestaurants : MOCK_RESTAURANTS
    const q = searchQuery.trim().toLowerCase()
    return source.filter((r) => {
      const cuisineOk =
        !selectedCuisine || (r.cuisines && r.cuisines.includes(selectedCuisine))
      const hay = `${r.name} ${(r.cuisines || []).join(' ')}`.toLowerCase()
      const qOk = !q || hay.includes(q)
      return cuisineOk && qOk
    })
  }, [searchQuery, selectedCuisine, remoteRestaurants])

  const cartCount = useMemo(() => cartItems.reduce((n, line) => n + line.qty, 0), [cartItems])
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cartItems]
  )

  useEffect(() => {
    if (cartCount > prevCount.current && prevCount.current >= 0) {
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
        Animated.spring(fabScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start()
    }
    prevCount.current = cartCount
  }, [cartCount, fabScale])

  const titleSize = width < 360 ? 21 : width < 480 ? 23 : 24

  return (
    <View style={styles.screen}>
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        topInset={insets.top}
        navTitle={modeConfig.navTitle}
        searchPlaceholder={modeConfig.search}
        searchAccessibilityLabel={modeConfig.search}
      />

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainContent}
        keyboardShouldPersistTaps="handled"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shopModeRow}
        >
          {SHOP_MODES.map((m) => {
            const active = shopMode === m.id
            return (
              <Pressable
                key={m.id}
                onPress={() => setShopMode(m.id)}
                style={[styles.shopModeChip, active && styles.shopModeChipActive]}
              >
                <Text style={[styles.shopModeChipTxt, active && styles.shopModeChipTxtActive]}>{m.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {shopMode === 'food' ? (
          <>
            <Text style={[styles.pageTitle, { fontSize: titleSize }]}>Food delivery</Text>
            <Text style={styles.pageSubtitle}>
              Browse restaurants, order in a few taps — drones keep it fast.
            </Text>
            <View style={styles.localBanner}>
              <Ionicons name="navigate-circle" size={22} color={K.green} />
              <Text style={styles.localBannerText}>
                Drone corridor: skip ground traffic — hot food, predictable ETAs across Nairobi hubs.
              </Text>
            </View>
            <QuickActions />
            <Text style={styles.sectionTitle}>Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              {FOOD_CUISINES.map((cat) => {
                const active = selectedCuisine === cat
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCuisine(cat)}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipTxt, active && styles.categoryChipTxtActive]}>{cat}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Text style={styles.sectionTitle}>Restaurants</Text>

            {loading ? (
              <View style={styles.restList}>
                {[1, 2, 3].map((k) => (
                  <RestaurantSkeleton key={k} />
                ))}
              </View>
            ) : filteredRestaurants.length === 0 ? (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  No restaurants match &ldquo;{searchQuery}&rdquo;. Try another search or category.
                </Text>
              </View>
            ) : (
              <View style={styles.restList}>
                {filteredRestaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    onPress={() => router.push(`/restaurant/${r.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        ) : shopMode === 'groceries' ? (
          <>
            <Text style={[styles.pageTitle, { fontSize: titleSize }]}>Groceries</Text>
            <Text style={styles.pageSubtitle}>
              Aisles, deals, and buy again — fresh picks routed by drone with payload-aware ETAs.
            </Text>
            <QuickActions />
            <GroceryBrowse
              searchQuery={searchQuery}
              selectedAisle={selectedGroceryAisle}
              onAisleChange={setSelectedGroceryAisle}
            />
          </>
        ) : (
          <>
            <Text style={[styles.pageTitle, { fontSize: titleSize }]}>Pharmacy</Text>
            <Text style={styles.pageSubtitle}>
              OTC and prescription items — upload Rx at checkout for restricted medicines.
            </Text>
            <QuickActions />
            <PharmacyBrowse
              searchQuery={searchQuery}
              selectedCategory={selectedPharmaCategory}
              onCategoryChange={setSelectedPharmaCategory}
            />
          </>
        )}
      </ScrollView>

      <Animated.View style={[styles.fabWrap, { bottom: 24 + insets.bottom, right: 24, transform: [{ scale: fabScale }] }]}>
        <Pressable
          style={styles.fab}
          onPress={() => setCartOpen(true)}
          accessibilityLabel={cartCount ? `Open cart, ${cartCount} items` : 'Open cart'}
        >
          <Ionicons name="cart" size={26} color={C.white} />
          {cartCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>

      {cartCount > 0 && cartTotal > 0 ? (
        <Pressable
          style={[styles.miniBar, { bottom: 96 + insets.bottom, left: 16, right: 88 }]}
          onPress={() => setCartOpen(true)}
        >
          <Text style={styles.miniBarTxt} numberOfLines={1}>
            {cartCount} items · {formatKes(cartTotal)}
          </Text>
          <Text style={styles.miniBarCta}>View cart</Text>
        </Pressable>
      ) : null}

      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onRemoveLine={removeLine}
        onAdjustQty={adjustQty}
        cartCount={cartCount}
        cartTotal={cartTotal}
        onCheckout={() => {
          setCartOpen(false)
          router.push('/order')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  navOuter: {
    backgroundColor: 'rgba(9,14,34,0.95)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  navInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.cyan600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 18 },
  navTitleFull: {
    fontWeight: '700',
    color: '#c7d2fe',
    maxWidth: 160,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingLeft: 10,
    minWidth: 0,
  },
  searchIcon: { marginRight: 4 },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    fontSize: 14,
    color: '#e2e8f0',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  pressed: { opacity: 0.85 },
  mainScroll: { flex: 1 },
  mainContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 160,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: C.slate900,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: C.slate600,
    marginBottom: 12,
    lineHeight: 20,
  },
  quickWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickBtnTxt: {
    fontWeight: '700',
    color: C.cyan700,
    fontSize: 13,
  },
  localBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: K.greenMuted,
    borderWidth: 1,
    borderColor: '#c8e6c9',
    marginBottom: 20,
  },
  localBannerText: {
    flex: 1,
    fontSize: 13,
    color: C.slate800,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.slate600,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  shopModeRow: {
    gap: 8,
    paddingBottom: 16,
    flexGrow: 0,
  },
  shopModeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: C.white,
  },
  shopModeChipActive: {
    backgroundColor: '#312e81',
    borderColor: '#6366f1',
  },
  shopModeChipTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: C.slate600,
  },
  shopModeChipTxtActive: {
    color: '#e0e7ff',
  },
  categoryRow: {
    gap: 8,
    paddingBottom: 10,
    marginBottom: 8,
  },
  categoryChip: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.white,
  },
  categoryChipActive: {
    backgroundColor: '#dbeafe',
    borderColor: C.indigo600,
  },
  categoryChipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: C.slate600,
  },
  categoryChipTxtActive: {
    color: C.indigo600,
  },
  restList: {
    gap: 10,
  },
  restCard: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0b1120',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  restImgWrap: {
    width: 88,
    minHeight: 40,
    backgroundColor: C.slate200,
    position: 'relative',
  },
  restImg: { width: '100%', height: '10%', minHeight: 90 },
  restRatingPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  restRatingPillTxt: {
    fontSize: 11,
    fontWeight: '800',
    color: C.slate900,
  },
  restBody: { flex: 1, padding: 10, justifyContent: 'center' },
  restName: { fontSize: 14, fontWeight: '800', color: C.slate900, letterSpacing: -0.2 },
  restMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  restMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  restMeta: { fontSize: 10, fontWeight: '600', color: C.slate600 },
  restChev: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  restOpen: { fontSize: 11, fontWeight: '800', color: C.indigo600 },
  noResults: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.slate200,
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  noResultsText: {
    textAlign: 'center',
    color: C.slate600,
    fontSize: 15,
  },
  skeletonBlock: {
    backgroundColor: '#e2e8f0',
  },
  skeletonLine: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
  },
  fabWrap: {
    position: 'absolute',
    zIndex: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: C.indigo600,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  miniBar: {
    position: 'absolute',
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.25)',
  },
  miniBarTxt: { color: '#e2e8f0', fontSize: 14, fontWeight: '700', flex: 1, marginRight: 8 },
  miniBarCta: { color: C.cyan600, fontWeight: '800', fontSize: 14 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.rose500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: C.white, fontSize: 11, fontWeight: '700' },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.45)',
  },
  cartSheet: {
    maxHeight: '92%',
    backgroundColor: C.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.slate200,
  },
  cartTitle: { fontSize: 18, fontWeight: '600', color: C.slate900 },
  cartSubtitle: { fontSize: 14, fontWeight: '400', color: C.slate500 },
  closeBtn: { padding: 8 },
  cartScroll: { maxHeight: 420 },
  cartScrollContent: { padding: 20, paddingBottom: 8 },
  cartSection: { marginBottom: 8 },
  cartSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  cartRx: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
    marginTop: 2,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 16,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.slate800 },
  emptyHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: C.slate500,
    maxWidth: 280,
  },
  cartLine: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
    marginBottom: 12,
  },
  cartThumb: { width: 64, height: 64, borderRadius: 8 },
  cartLineMid: { flex: 1, minWidth: 0 },
  cartLineName: { fontSize: 14, fontWeight: '500', color: C.slate900 },
  cartRest: { fontSize: 11, fontWeight: '600', color: C.slate500, marginTop: 2 },
  cartLineMeta: { marginTop: 4, fontSize: 13, color: C.slate600 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: { fontSize: 15, fontWeight: '800', color: C.slate900, minWidth: 22, textAlign: 'center' },
  removePress: { marginLeft: 'auto' },
  removeLink: { fontSize: 12, fontWeight: '600', color: '#dc2626' },
  cartLineTotal: { fontSize: 14, fontWeight: '600', color: C.slate900, alignSelf: 'flex-start' },
  cartFooter: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.slate200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 16, fontWeight: '500', color: C.slate600 },
  totalValue: { fontSize: 22, fontWeight: '700', color: C.slate900 },
  checkoutBtn: {
    marginTop: 16,
    backgroundColor: C.indigo600,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutBtnText: { color: C.white, fontWeight: '600', fontSize: 14 },
})
