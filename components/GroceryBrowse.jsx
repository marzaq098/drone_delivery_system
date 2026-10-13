import React, { useMemo } from 'react'
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { K, formatKes } from '../constants/kenyaBrand'
import {
  GROCERY_AISLES,
  MOCK_GROCERY_PRODUCTS,
  MOCK_BUY_AGAIN_IDS,
  GROCERY_META,
  toGroceryProduct,
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
  emerald600: '#059669',
  rose500: K.red,
  white: '#ffffff',
}

function ProductRow({ product, sku, lineQty, onAdd, onDelta }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.thumb} resizeMode="cover" />
      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          {sku.isDeal ? (
            <View style={styles.dealPill}>
              <Text style={styles.dealPillTxt}>{sku.dealLabel || 'Deal'}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.metaLine} numberOfLines={1}>
          {sku.aisle} · ~{sku.weightKg} kg · ~{GROCERY_META.droneEtaMins} min drone
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatKes(product.price)}</Text>
          {lineQty === 0 ? (
            <Pressable
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              onPress={() => onAdd(product)}
              accessibilityLabel={`Add ${product.name}`}
            >
              <Ionicons name="add" size={20} color={C.white} />
            </Pressable>
          ) : (
            <View style={styles.qtyBar}>
              <Pressable style={styles.qtyBtn} onPress={() => onDelta(product.id, -1)} hitSlop={6}>
                <Ionicons name="remove" size={16} color={C.indigo600} />
              </Pressable>
              <Text style={styles.qtyVal}>{lineQty}</Text>
              <Pressable style={styles.qtyBtn} onPress={() => onDelta(product.id, 1)} hitSlop={6}>
                <Ionicons name="add" size={16} color={C.indigo600} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

export default function GroceryBrowse({ searchQuery, selectedAisle, onAisleChange }) {
  const { cartItems, addToCart, adjustQty } = useCart()

  const qtyById = useMemo(() => {
    const m = new Map()
    for (const line of cartItems) {
      m.set(line.product.id, line.qty)
    }
    return m
  }, [cartItems])

  const buyAgainProducts = useMemo(() => {
    return MOCK_BUY_AGAIN_IDS.map((id) => {
      const sku = MOCK_GROCERY_PRODUCTS.find((s) => s.id === id)
      return sku ? toGroceryProduct(sku) : null
    }).filter(Boolean)
  }, [])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return MOCK_GROCERY_PRODUCTS.filter((sku) => {
      const aisleOk = selectedAisle === 'All' || sku.aisle === selectedAisle
      const hay = `${sku.name} ${sku.aisle}`.toLowerCase()
      const qOk = !q || hay.includes(q)
      return aisleOk && qOk
    })
  }, [searchQuery, selectedAisle])

  const popular = useMemo(() => MOCK_GROCERY_PRODUCTS.slice(0, 3), [])
  const deals = useMemo(() => MOCK_GROCERY_PRODUCTS.filter((s) => s.isDeal), [])

  function lineQtyFor(productId) {
    return qtyById.get(productId) || 0
  }

  return (
    <View>
      <View style={styles.droneStrip}>
        <Ionicons name="battery-charging" size={18} color={C.emerald600} />
        <Text style={styles.droneStripTxt}>
          Fresh hub · {GROCERY_META.name} · delivery from {formatKes(GROCERY_META.deliveryFee)} · payload
          aware routing
        </Text>
      </View>

      <Text style={styles.sectionLabel}>Aisles</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {GROCERY_AISLES.map((a) => {
          const active = selectedAisle === a
          return (
            <Pressable
              key={a}
              onPress={() => onAisleChange(a)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtActive]}>{a}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {buyAgainProducts.length > 0 ? (
        <>
          <Text style={styles.h2}>Buy again</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {buyAgainProducts.map((p) => (
                <View key={p.id} style={styles.compactCard}>
                  <Image source={{ uri: p.image }} style={styles.compactImg} />
                  <Text style={styles.compactName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  <Text style={styles.compactPrice}>{formatKes(p.price)}</Text>
                  <Pressable style={styles.compactAdd} onPress={() => addToCart(p)}>
                    <Text style={styles.compactAddTxt}>+ Add</Text>
                  </Pressable>
                </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      <Text style={styles.h2}>Popular</Text>
      <View style={styles.stack}>
        {popular.map((sku) => {
          const p = toGroceryProduct(sku)
          return (
            <ProductRow
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

      {deals.length > 0 ? (
        <>
          <Text style={styles.h2}>Deals</Text>
          <View style={styles.stack}>
            {deals.map((sku) => {
              const p = toGroceryProduct(sku)
              return (
                <ProductRow
                  key={`d-${sku.id}`}
                  product={p}
                  sku={sku}
                  lineQty={lineQtyFor(p.id)}
                  onAdd={addToCart}
                  onDelta={adjustQty}
                />
              )
            })}
          </View>
        </>
      ) : null}

      <Text style={styles.h2}>All products</Text>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTxt}>No items match your search or aisle.</Text>
        </View>
      ) : (
        <View style={styles.stack}>
          {filtered.map((sku) => {
            const p = toGroceryProduct(sku)
            return (
              <ProductRow
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
    </View>
  )
}

const styles = StyleSheet.create({
  droneStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 14,
  },
  droneStripTxt: { flex: 1, fontSize: 12, color: C.slate800, lineHeight: 17 },
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
  chipActive: { backgroundColor: '#dbeafe', borderColor: C.indigo600 },
  chipTxt: { fontSize: 13, fontWeight: '700', color: C.slate600 },
  chipTxtActive: { color: C.indigo600 },
  h2: { fontSize: 17, fontWeight: '800', color: C.slate900, marginBottom: 10, marginTop: 4 },
  hRow: { gap: 12, paddingBottom: 16 },
  compactCard: {
    width: 128,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    padding: 8,
  },
  compactImg: { width: '100%', height: 64, borderRadius: 9, backgroundColor: C.slate200 },
  compactName: { marginTop: 7, fontSize: 12, fontWeight: '700', color: C.slate900, minHeight: 32 },
  compactPrice: { marginTop: 3, fontSize: 11, fontWeight: '600', color: C.slate600 },
  compactAdd: {
    marginTop: 7,
    backgroundColor: C.indigo600,
    borderRadius: 7,
    paddingVertical: 7,
    alignItems: 'center',
  },
  compactAddTxt: { color: C.white, fontWeight: '800', fontSize: 11 },
  stack: { gap: 10, marginBottom: 8 },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#0b1120', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  thumb: { width: 92, minHeight: 100, backgroundColor: C.slate200 },
  cardBody: { flex: 1, padding: 10, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' },
  name: { flex: 1, fontSize: 14, fontWeight: '800', color: C.slate900 },
  dealPill: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  dealPillTxt: { fontSize: 11, fontWeight: '800', color: C.rose500 },
  metaLine: { marginTop: 5, fontSize: 10, color: C.slate600, fontWeight: '600' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  price: { fontSize: 15, fontWeight: '800', color: C.slate900 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.indigo600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.88 },
  qtyBar: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: C.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: { fontSize: 14, fontWeight: '800', color: C.slate900, minWidth: 18, textAlign: 'center' },
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
})
