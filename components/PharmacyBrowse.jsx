import React, { useMemo } from 'react'
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatKes } from '../constants/kenyaBrand'
import {
  PHARMACY_CATEGORIES,
  MOCK_PHARMACY_PRODUCTS,
  PHARMACY_META,
  toPharmacyProduct,
} from '../constants/groceryPharmaMock'
import { useCart } from '../context/CartContext'

const C = {
  indigo600: '#4f46e5',
  slate50: '#f8fafc',
  slate200: '#dbe4ef',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: '#0f172a',
  amber600: '#d97706',
  white: '#ffffff',
}

function PharmaRow({ product, sku, lineQty, onAdd, onDelta }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.thumb} resizeMode="cover" />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {sku.requiresPrescription ? (
            <View style={styles.rxPill}>
              <Text style={styles.rxPillTxt}>Rx</Text>
            </View>
          ) : (
            <View style={styles.otcPill}>
              <Text style={styles.otcPillTxt}>OTC</Text>
            </View>
          )}
        </View>
        <Text style={styles.catLine} numberOfLines={1}>
          {sku.category} · ~{PHARMACY_META.droneEtaMins} min
        </Text>
        <Text style={styles.safety} numberOfLines={3}>
          {sku.safetyNote}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatKes(product.price)}</Text>
          {lineQty === 0 ? (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              onPress={() => onAdd(product)}
              accessibilityLabel={`Add ${product.name}`}
            >
              <Ionicons name="add" size={22} color={C.white} />
            </Pressable>
          ) : (
            <View style={styles.qtyBar}>
              <Pressable style={styles.qtyBtn} onPress={() => onDelta(product.id, -1)} hitSlop={6}>
                <Ionicons name="remove" size={18} color={C.indigo600} />
              </Pressable>
              <Text style={styles.qtyVal}>{lineQty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => onDelta(product.id, 1)} hitSlop={6}>
                <Ionicons name="add" size={18} color={C.indigo600} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default function PharmacyBrowse({ searchQuery, selectedCategory, onCategoryChange }) {
  const { cartItems, addToCart, adjustQty } = useCart()

  const qtyById = useMemo(() => {
    const m = new Map()
    for (const line of cartItems) {
      m.set(line.product.id, line.qty)
    }
    return m
  }, [cartItems])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return MOCK_PHARMACY_PRODUCTS.filter((sku) => {
      const catOk = selectedCategory === 'All' || sku.category === selectedCategory
      const hay = `${sku.name} ${sku.category} ${sku.description}`.toLowerCase()
      const qOk = !q || hay.includes(q)
      return catOk && qOk
    })
  }, [searchQuery, selectedCategory])

  function lineQtyFor(productId) {
    return qtyById.get(productId) || 0
  }

  return (
    <View>
      <View style={styles.safetyBanner}>
        <Ionicons name="medkit-outline" size={20} color={C.amber600} />
        <Text style={styles.safetyBannerTxt}>
          Pharmacy orders follow Kenya regulations. Restricted items need a valid prescription before
          checkout — upload a clear photo/PDF in checkout.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {PHARMACY_CATEGORIES.map((c) => {
          const active = selectedCategory === c
          return (
            <Pressable
              key={c}
              onPress={() => onCategoryChange(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{c}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <Text style={styles.h2}>Medicines</Text>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No medicines match your search.</Text>
        </View>
      ) : (
        <View style={styles.stack}>
          {filtered.map((sku) => {
            const p = toPharmacyProduct(sku)
            return (
              <PharmaRow
                key={sku.id}
                product={p}
                sku={sku}
                lineQty={lineQtyFor(p.id)}
                onAdd={addToCart}
                onDelta={adjustQty}
              />
            )
          })}
        </View>
      )}

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteTxt}>
          {PHARMACY_META.name} · delivery from {formatKes(PHARMACY_META.deliveryFee)}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  safetyBannerTxt: { flex: 1, fontSize: 12, color: C.slate800, lineHeight: 18 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: C.slate500, marginBottom: 8, textTransform: 'uppercase' },
  chipRow: { gap: 8, paddingBottom: 14 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.white,
  },
  chipActive: { backgroundColor: '#ede9fe', borderColor: C.indigo600 },
  chipTxt: { fontSize: 13, fontWeight: '700', color: C.slate600 },
  chipTxtActive: { color: C.indigo600 },
  h2: { fontSize: 17, fontWeight: '800', color: C.slate900, marginBottom: 10 },
  stack: { gap: 12 },
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0b1120', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  thumb: { width: 100, minHeight: 120, backgroundColor: C.slate200 },
  cardBody: { flex: 1, padding: 12, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  name: { flex: 1, fontSize: 15, fontWeight: '800', color: C.slate900 },
  rxPill: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  rxPillTxt: { fontSize: 11, fontWeight: '800', color: C.amber600 },
  otcPill: {
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  otcPillTxt: { fontSize: 11, fontWeight: '800', color: C.slate600 },
  catLine: { marginTop: 6, fontSize: 11, color: C.slate600, fontWeight: '600' },
  safety: { marginTop: 6, fontSize: 11, color: C.slate500, lineHeight: 15 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  price: { fontSize: 16, fontWeight: '800', color: C.slate900 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  qtyBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: C.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: { fontSize: 15, fontWeight: '800', color: C.slate900, minWidth: 20, textAlign: 'center' },
  empty: {
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: C.slate200,
    backgroundColor: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  emptyTxt: { textAlign: 'center', color: C.slate600, fontSize: 14 },
  footerNote: { marginTop: 16, marginBottom: 8 },
  footerNoteTxt: { fontSize: 12, color: C.slate500, fontWeight: '600' },
})
