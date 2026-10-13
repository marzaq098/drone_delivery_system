import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCart } from '../context/CartContext'
import { K, formatKes, VAT_RATE_KE } from '../constants/kenyaBrand'
import * as Location from 'expo-location'
import { getOrderPaymentStatus, initiateMpesaSTK } from '../lib/paymentsApi'
import { createOrderApi } from '../api/orders'
import { getAuthSession } from '../lib/authSession'

const C = {
  cyan600: '#22d3ee',
  cyan700: '#0891b2',
  indigo600: '#4f46e5',
  navy900: '#0f172a',
  slate50: '#f8fafc',
  slate100: '#eef4ff',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate800: '#1e293b',
  slate900: K.black,
  emerald600: '#059669',
  rose600: K.red,
  white: '#ffffff',
}

const PAYMENT_OPTIONS = [
  { id: 'mpesa', label: 'M-Pesa (Safaricom)', icon: 'phone-portrait-outline', recommended: true },
  { id: 'cod', label: 'Cash on delivery (COD)', icon: 'cash-outline' },
  { id: 'card', label: 'Card (Visa / Mastercard)', icon: 'card-outline' },
]

const ORDER_TYPES = [
  { id: 'STORE_ORDER', label: 'Store order', icon: 'basket-outline' },
  { id: 'P2P_DELIVERY', label: 'Send something (parcel)', icon: 'send-outline' },
  { id: 'ASK_ANYTHING', label: 'Ask for anything', icon: 'chatbox-ellipses-outline' },
]

const PROMOTIONS = [
  { code: 'KARIBU100', kind: 'flat', value: 100 },
  { code: 'QDD10', kind: 'percent', value: 10 },
  { code: 'PHARMA5', kind: 'percent', value: 5 },
]

function SectionCard({ title, icon, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={C.cyan600} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function CartItemRow({ line, onRemove, onAdjustQty }) {
  const lineTotal = line.product.price * line.qty
  const p = line.product
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowMain}>
        <Text style={styles.cartName} numberOfLines={2}>
          {p.name}
        </Text>
        {p.requiresPrescription ? (
          <Text style={styles.rxLine}>Prescription required (Rx)</Text>
        ) : null}
        {p.restaurantName && p.storeType !== 'grocery' && p.storeType !== 'pharmacy' ? (
          <Text style={styles.cartRestSmall} numberOfLines={1}>
            {p.restaurantName}
          </Text>
        ) : null}
        {p.groceryStoreName ? (
          <Text style={styles.cartRestSmall} numberOfLines={1}>
            Groceries · {p.groceryStoreName}
          </Text>
        ) : null}
        {p.pharmacyName ? (
          <Text style={styles.cartRestSmall} numberOfLines={1}>
            Pharmacy · {p.pharmacyName}
          </Text>
        ) : null}
        <Text style={styles.cartMeta}>
          {formatKes(p.price)} each
        </Text>
        <View style={styles.inlineQty}>
          <Pressable style={styles.inlineQtyBtn} onPress={() => onAdjustQty(p.id, -1)} hitSlop={6}>
            <Text style={styles.inlineQtyTxt}>−</Text>
          </Pressable>
          <Text style={styles.inlineQtyVal}>{line.qty}</Text>
          <Pressable style={styles.inlineQtyBtn} onPress={() => onAdjustQty(p.id, 1)} hitSlop={6}>
            <Text style={styles.inlineQtyTxt}>+</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.cartRowEnd}>
        <Text style={styles.cartLinePrice}>{formatKes(lineTotal)}</Text>
        <Pressable onPress={() => onRemove(p.id)} hitSlop={8}>
          <Text style={styles.removeTxt}>Remove</Text>
        </Pressable>
      </View>
    </View>
  )
}

function PaymentOption({ option, selected, onSelect }) {
  const active = selected === option.id
  return (
    <Pressable
      onPress={() => onSelect(option.id)}
      style={[styles.payRow, active && styles.payRowActive]}
      accessibilityRole="radio"
      accessibilityState={{ checked: active }}
    >
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        {active ? <View style={styles.radioInner} /> : null}
      </View>
      <Ionicons name={option.icon} size={22} color={active ? C.cyan600 : C.slate500} />
      <View style={styles.payLabelCol}>
        <Text style={[styles.payLabel, active && styles.payLabelActive]}>{option.label}</Text>
        {option.recommended ? (
          <View style={styles.recommendedPill}>
            <Text style={styles.recommendedPillTxt}>Most used · Kenya</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  )
}

export default function OrderPage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const contentWidth = Math.max(280, Math.min(560, width - 32))
  const { cartItems, removeLine, adjustQty, clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [orderType, setOrderType] = useState('STORE_ORDER')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [packageWeight, setPackageWeight] = useState('')
  const [askAnythingNote, setAskAnythingNote] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [deliveryWindow, setDeliveryWindow] = useState('asap')
  const [promoCode, setPromoCode] = useState('')
  const [isPrime, setIsPrime] = useState(false)
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState(null)
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [mpesaPrompt, setMpesaPrompt] = useState('')
  const [currentOrderId, setCurrentOrderId] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [orderSnapshot, setOrderSnapshot] = useState(null)

  const needsRx = useMemo(
    () => cartItems.some((l) => l.product.requiresPrescription),
    [cartItems]
  )

  useEffect(() => {
    if (!needsRx) setPrescriptionUploaded(false)
  }, [needsRx])

  const subtotal = useMemo(
    () => cartItems.reduce((s, line) => s + line.product.price * line.qty, 0),
    [cartItems]
  )

  const deliveryFee = useMemo(() => {
    let base =
      orderType === 'P2P_DELIVERY' ? 250 : orderType === 'ASK_ANYTHING' ? 300 : 180
    if (orderType === 'STORE_ORDER' && cartItems.length > 0) {
      const fees = cartItems
        .map((l) => l.product?.deliveryFee)
        .filter((f) => typeof f === 'number' && !Number.isNaN(f))
      if (fees.length > 0) base = Math.max(...fees)
    }
    return isPrime ? Math.max(0, base - 150) : base
  }, [isPrime, orderType, cartItems])

  const promo = useMemo(() => {
    const code = promoCode.trim().toUpperCase()
    return PROMOTIONS.find((p) => p.code === code) || null
  }, [promoCode])

  const tax = useMemo(() => Math.round(subtotal * VAT_RATE_KE * 100) / 100, [subtotal])
  const discount = useMemo(() => {
    if (!promo) return 0
    if (promo.kind === 'flat') return Math.min(promo.value, subtotal + deliveryFee)
    return Math.round(((subtotal + deliveryFee) * promo.value) / 100)
  }, [promo, subtotal, deliveryFee])
  const total = useMemo(() => Math.max(0, subtotal + tax + deliveryFee - discount), [subtotal, tax, deliveryFee, discount])

  function validate() {
    const next = {}
    if (orderType === 'STORE_ORDER' && !address.trim()) next.address = 'Delivery address is required'
    if (orderType === 'P2P_DELIVERY') {
      if (!pickup.trim()) next.pickup = 'Pickup is required'
      if (!dropoff.trim()) next.dropoff = 'Drop-off is required'
      if (!packageDescription.trim()) next.packageDescription = 'Package description is required'
      if (!packageWeight.trim()) next.packageWeight = 'Package weight is required'
      else if (Number.isNaN(Number(packageWeight)) || Number(packageWeight) <= 0) {
        next.packageWeight = 'Enter a valid weight in kg'
      }
    }
    if (orderType === 'ASK_ANYTHING' && !askAnythingNote.trim()) {
      next.askAnythingNote = 'Please describe your request'
    }
    if (deliveryWindow === 'schedule') {
      if (!scheduledTime.trim()) next.scheduledTime = 'Pick a date and time'
      else if (Number.isNaN(Date.parse(scheduledTime))) next.scheduledTime = 'Use a valid date/time format'
    }
    if (promoCode.trim() && !promo) next.promoCode = 'Promo code is not valid'
    if (!paymentMethod) next.payment = 'Select a payment method'
    if (paymentMethod === 'mpesa' && !mpesaPhone.trim()) next.mpesaPhone = 'M-Pesa phone is required'
    if (orderType === 'STORE_ORDER' && needsRx && !prescriptionUploaded) {
      next.prescription = 'Upload a prescription image for restricted pharmacy items'
    }
    return next
  }

  async function useDeviceLocation() {
    const perm = await Location.requestForegroundPermissionsAsync()
    if (perm.status !== 'granted') {
      setErrors((e) => ({ ...e, address: 'Location permission denied' }))
      return
    }
    const enabled = await Location.hasServicesEnabledAsync()
    if (!enabled) {
      setErrors((e) => ({ ...e, address: 'Please enable GPS/location services' }))
      return
    }
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const lat = Number(p.coords.latitude.toFixed(6))
    const lng = Number(p.coords.longitude.toFixed(6))
    setPinnedCoords({ lat, lng })
    if (orderType === 'P2P_DELIVERY') {
      setPickup(`GPS pin: ${lat}, ${lng}`)
      setDropoff((prev) => prev || `Destination: ${lat + 0.004}, ${lng + 0.006}`)
    } else {
      setAddress(`GPS pin: ${lat}, ${lng}`)
      setErrors((e) => ({ ...e, address: undefined }))
    }
  }

  function goToTracking(orderId) {
    const finalOrderId = orderId || currentOrderId || `QDD-${Date.now().toString(36).toUpperCase()}`
    const params = {
      orderId: finalOrderId,
      droneId: `DRN-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    }
    if (pinnedCoords) {
      params.destLat = String(pinnedCoords.lat)
      params.destLng = String(pinnedCoords.lng)
    }
    router.replace({ pathname: '/tracking', params })
  }

  async function placeOrder() {
    const v = validate()
    if (Object.keys(v).length) {
      setErrors(v)
      return
    }
    setErrors({})
    setLoading(true)
    const orderId = `QDD-${Date.now().toString(36).toUpperCase()}`
    setCurrentOrderId(orderId)
    const session = await getAuthSession()
    const payload = {
      order_id: orderId,
      user_id: session?.user?.id || 'guest',
      items: cartItems.map((line) => ({
        product_id: line.product.id,
        name: line.product.name,
        qty: line.qty,
        unit_price: line.product.price,
      })),
      total_price: total,
      delivery_location: pinnedCoords
        ? { lat: pinnedCoords.lat, lng: pinnedCoords.lng }
        : null,
    }
    try {
      await createOrderApi(payload)
    } catch (e) {
      setLoading(false)
      setErrors((prev) => ({ ...prev, payment: e.message || 'Failed to create order' }))
      return
    }
    if (paymentMethod === 'mpesa') {
      try {
        const stk = await initiateMpesaSTK({
          phone: mpesaPhone.trim(),
          amount: total,
          orderId,
        })
        setMpesaPrompt(stk.message || 'Check your phone to complete payment')
        setPaymentStatus('PENDING')
      } catch (e) {
        setLoading(false)
        setErrors((prev) => ({ ...prev, payment: e.message || 'Failed to initiate M-Pesa STK push' }))
        return
      }
    } else {
      await new Promise((r) => setTimeout(r, 1200))
      setMpesaPrompt('')
      setPaymentStatus('PAID')
    }
    const snapTotal = total
    const snapPayment = PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)?.label ?? '—'
    setOrderSnapshot({
      total: snapTotal,
      paymentLabel: snapPayment,
      addressLine: address.trim() || dropoff.trim(),
      orderType,
      scheduledTime: deliveryWindow === 'asap' ? 'Now' : scheduledTime.trim() || 'ASAP',
      notes:
        askAnythingNote.trim() ||
        [packageDescription.trim(), packageWeight.trim() ? `${packageWeight.trim()} kg` : '']
          .filter(Boolean)
          .join(' · '),
      promo: promo?.code || null,
      subscription: isPrime ? 'QUANTUM_PRIME' : null,
      prescriptionAttached: needsRx ? prescriptionUploaded : null,
      orderId,
    })
    setLoading(false)
    setSummaryOpen(true)
  }

  function closeSummaryAndTrack() {
    if (paymentMethod === 'mpesa' && paymentStatus !== 'PAID') return
    setSummaryOpen(false)
    clearCart()
    setAddress('')
    setPaymentMethod('mpesa')
    setOrderType('STORE_ORDER')
    setPickup('')
    setDropoff('')
    setPackageDescription('')
    setPackageWeight('')
    setAskAnythingNote('')
    setScheduledTime('')
    setDeliveryWindow('asap')
    setPromoCode('')
    setIsPrime(false)
    setPrescriptionUploaded(false)
    setMpesaPhone('')
    setMpesaPrompt('')
    setCurrentOrderId('')
    setPaymentStatus('')
    setOrderSnapshot(null)
    goToTracking(orderSnapshot?.orderId)
  }

  async function refreshMpesaStatus() {
    if (!currentOrderId) return
    try {
      const order = await getOrderPaymentStatus(currentOrderId)
      const status = order?.payment_status || 'PENDING'
      setPaymentStatus(status)
      if (status === 'PAID') setMpesaPrompt('Payment confirmed. You can proceed to tracking.')
      if (status === 'FAILED') setMpesaPrompt('Payment failed. Please retry M-Pesa payment.')
    } catch (e) {
      setMpesaPrompt(e.message || 'Unable to fetch payment status')
    }
  }

  useEffect(() => {
    if (!summaryOpen || paymentMethod !== 'mpesa' || !currentOrderId || paymentStatus === 'PAID') return
    const id = setInterval(() => {
      refreshMpesaStatus()
    }, 5000)
    return () => clearInterval(id)
  }, [summaryOpen, paymentMethod, currentOrderId, paymentStatus])

  if (cartItems.length === 0 && !summaryOpen) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.emptyWrap, { width: contentWidth }]}>
          <Ionicons name="cart-outline" size={56} color={C.slate400} />
          <Text style={styles.emptyTitle}>Empty cart</Text>
          <Text style={styles.emptyHint}>
            Open Shop (Food, Groceries, or Pharmacy), add items — then checkout here.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.replace('/dashboard')}>
            <Text style={styles.primaryBtnText}>Back to shop</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={C.slate800} />
        </Pressable>
        <Text style={styles.topTitle}>Place order</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.scrollInner,
          { maxWidth: contentWidth, alignSelf: 'center', paddingBottom: 32 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={styles.brandLine}>
          <Text style={styles.brandEmoji}>✈</Text>
          <View>
            <Text style={styles.brandText}>Quantum Drop Drone</Text>
            <Text style={styles.brandSub}>Nairobi · Pay with M-Pesa</Text>
          </View>
        </View>
        <View style={styles.stepsRow}>
          {['Type', 'Address', 'Payment', 'Track'].map((label, i) => (
            <View key={label} style={styles.stepChip}>
              <Text style={styles.stepChipTxt}>{i + 1}. {label}</Text>
            </View>
          ))}
        </View>

        <SectionCard title="Order type" icon="layers-outline">
          {ORDER_TYPES.map((ot) => {
            const active = orderType === ot.id
            return (
              <Pressable
                key={ot.id}
                onPress={() => setOrderType(ot.id)}
                style={[styles.payRow, active && styles.payRowActive]}
              >
                <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                  {active ? <View style={styles.radioInner} /> : null}
                </View>
                <Ionicons name={ot.icon} size={22} color={active ? C.cyan600 : C.slate500} />
                <Text style={[styles.payLabel, active && styles.payLabelActive]}>{ot.label}</Text>
              </Pressable>
            )
          })}
          <Text style={styles.tipText}>
            Backend mapping: {orderType} · notes + scheduled_time supported in payload.
          </Text>
        </SectionCard>

        <SectionCard title="Selected items" icon="cube-outline">
          {cartItems.map((line) => (
            <CartItemRow
              key={line.product.id}
              line={line}
              onRemove={removeLine}
              onAdjustQty={adjustQty}
            />
          ))}
          <View style={styles.divider} />
          <View style={styles.totalLine}>
            <Text style={styles.totalMuted}>Subtotal</Text>
            <Text style={styles.totalVal}>{formatKes(subtotal)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalMuted}>VAT (16%) · Kenya</Text>
            <Text style={styles.totalVal}>{formatKes(tax)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalMuted}>Delivery fee</Text>
            <Text style={styles.totalVal}>{formatKes(deliveryFee)}</Text>
          </View>
          <View style={styles.totalLine}>
            <Text style={styles.totalMuted}>Discount</Text>
            <Text style={styles.totalVal}>- {formatKes(discount)}</Text>
          </View>
          <View style={[styles.totalLine, styles.grandRow]}>
            <Text style={styles.grandLabel}>Total</Text>
            <Text style={styles.grandValue}>{formatKes(total)}</Text>
          </View>
        </SectionCard>

        {orderType === 'STORE_ORDER' && needsRx ? (
          <SectionCard title="Prescription" icon="document-text-outline">
            <Text style={styles.rxInfo}>
              Your cart includes restricted items. Upload a clear photo or PDF of a valid prescription issued in
              Kenya. A pharmacist may contact you before dispatch.
            </Text>
            <Pressable
              style={[styles.rxUploadBtn, prescriptionUploaded && styles.rxUploadBtnDone]}
              onPress={() => {
                setPrescriptionUploaded(true)
                if (errors.prescription) setErrors((e) => ({ ...e, prescription: undefined }))
              }}
            >
              <Ionicons
                name={prescriptionUploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                size={22}
                color={prescriptionUploaded ? C.emerald600 : C.cyan600}
              />
              <Text style={styles.rxUploadBtnTxt}>
                {prescriptionUploaded ? 'Prescription attached (demo)' : 'Upload prescription (demo)'}
              </Text>
            </Pressable>
            {errors.prescription ? <Text style={styles.errText}>{errors.prescription}</Text> : null}
          </SectionCard>
        ) : null}

        <SectionCard title="Delivery address" icon="location-outline">
          {orderType === 'STORE_ORDER' ? (
            <>
              <TextInput
                style={styles.textArea}
                placeholder="Street, building, landmark…"
                placeholderTextColor={C.slate400}
                multiline
                numberOfLines={4}
                value={address}
                onChangeText={(t) => {
                  setAddress(t)
                  if (errors.address) setErrors((e) => ({ ...e, address: undefined }))
                }}
                textAlignVertical="top"
              />
              {errors.address ? <Text style={styles.errText}>{errors.address}</Text> : null}
            </>
          ) : null}
          {orderType === 'P2P_DELIVERY' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Pickup location"
                placeholderTextColor={C.slate400}
                value={pickup}
                onChangeText={(t) => setPickup(t)}
              />
              {errors.pickup ? <Text style={styles.errText}>{errors.pickup}</Text> : null}
              <TextInput
                style={[styles.input, styles.inputGap]}
                placeholder="Drop-off location"
                placeholderTextColor={C.slate400}
                value={dropoff}
                onChangeText={(t) => setDropoff(t)}
              />
              {errors.dropoff ? <Text style={styles.errText}>{errors.dropoff}</Text> : null}
              <TextInput
                style={[styles.textArea, styles.inputGap]}
                placeholder="Package description"
                placeholderTextColor={C.slate400}
                multiline
                value={packageDescription}
                onChangeText={(t) => setPackageDescription(t)}
              />
              {errors.packageDescription ? <Text style={styles.errText}>{errors.packageDescription}</Text> : null}
              <TextInput
                style={[styles.input, styles.inputGap]}
                placeholder="Package weight (kg)"
                placeholderTextColor={C.slate400}
                keyboardType="numeric"
                value={packageWeight}
                onChangeText={(t) => setPackageWeight(t)}
              />
              {errors.packageWeight ? <Text style={styles.errText}>{errors.packageWeight}</Text> : null}
            </>
          ) : null}
          {orderType === 'ASK_ANYTHING' ? (
            <>
              <TextInput
                style={styles.textArea}
                placeholder="Describe your errand/request"
                placeholderTextColor={C.slate400}
                multiline
                value={askAnythingNote}
                onChangeText={(t) => setAskAnythingNote(t)}
              />
              {errors.askAnythingNote ? <Text style={styles.errText}>{errors.askAnythingNote}</Text> : null}
            </>
          ) : null}
          <Pressable style={styles.secondaryBtn} onPress={useDeviceLocation}>
            <Ionicons name="navigate-outline" size={18} color={C.cyan600} />
            <Text style={styles.secondaryBtnText}>Use current GPS location</Text>
          </Pressable>
        </SectionCard>

        <SectionCard title="Schedule + offers" icon="time-outline">
          <View style={styles.timeChips}>
            <Pressable
              style={[styles.timeChip, deliveryWindow === 'asap' && styles.timeChipOn]}
              onPress={() => {
                setDeliveryWindow('asap')
                setScheduledTime('')
                setErrors((e) => ({ ...e, scheduledTime: undefined }))
              }}
            >
              <Text style={[styles.timeChipTxt, deliveryWindow === 'asap' && styles.timeChipTxtOn]}>Now</Text>
            </Pressable>
            <Pressable
              style={[styles.timeChip, deliveryWindow === 'schedule' && styles.timeChipOn]}
              onPress={() => setDeliveryWindow('schedule')}
            >
              <Text style={[styles.timeChipTxt, deliveryWindow === 'schedule' && styles.timeChipTxtOn]}>
                Schedule
              </Text>
            </Pressable>
          </View>
          {deliveryWindow === 'schedule' ? (
            <>
              <TextInput
                style={[styles.input, styles.inputGap]}
                placeholder="YYYY-MM-DD HH:mm or ISO date"
                placeholderTextColor={C.slate400}
                value={scheduledTime}
                onChangeText={(t) => {
                  setScheduledTime(t)
                  if (errors.scheduledTime) setErrors((e) => ({ ...e, scheduledTime: undefined }))
                }}
              />
              {errors.scheduledTime ? <Text style={styles.errText}>{errors.scheduledTime}</Text> : null}
            </>
          ) : (
            <Text style={styles.asapHint}>Drone dispatch starts immediately after confirmation.</Text>
          )}
          <TextInput
            style={[styles.input, styles.inputGap]}
            placeholder="Promo code (e.g. KARIBU100)"
            placeholderTextColor={C.slate400}
            value={promoCode}
            onChangeText={(t) => setPromoCode(t)}
            autoCapitalize="characters"
          />
          {errors.promoCode ? <Text style={styles.errText}>{errors.promoCode}</Text> : null}
          <Pressable style={styles.primeToggle} onPress={() => setIsPrime((v) => !v)}>
            <Ionicons name={isPrime ? 'checkbox' : 'square-outline'} size={20} color={C.cyan600} />
            <Text style={styles.primeText}>Quantum Prime (reduced delivery fee)</Text>
          </Pressable>
        </SectionCard>

        <SectionCard title="Payment" icon="wallet-outline">
          {PAYMENT_OPTIONS.map((opt) => (
            <PaymentOption
              key={opt.id}
              option={opt}
              selected={paymentMethod}
              onSelect={(id) => {
                setPaymentMethod(id)
                if (errors.payment) setErrors((e) => ({ ...e, payment: undefined }))
              }}
            />
          ))}
          {errors.payment ? <Text style={styles.errText}>{errors.payment}</Text> : null}
          {paymentMethod === 'mpesa' ? (
            <>
              <TextInput
                style={[styles.input, styles.inputGap]}
                placeholder="M-Pesa phone (e.g. 07XXXXXXXX)"
                placeholderTextColor={C.slate400}
                value={mpesaPhone}
                onChangeText={(t) => {
                  setMpesaPhone(t)
                  if (errors.mpesaPhone) setErrors((e) => ({ ...e, mpesaPhone: undefined }))
                }}
                keyboardType="phone-pad"
              />
              {errors.mpesaPhone ? <Text style={styles.errText}>{errors.mpesaPhone}</Text> : null}
              <Text style={styles.tipText}>
                Check your phone to complete payment after placing the order.
              </Text>
            </>
          ) : null}
        </SectionCard>

        <Pressable
          style={({ pressed }) => [
            styles.placeOrderBtn,
            pressed && styles.pressed,
            loading && styles.btnDisabled,
          ]}
          onPress={placeOrder}
          disabled={loading || cartItems.length === 0}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <Ionicons name="rocket-outline" size={22} color={C.white} />
              <Text style={styles.placeOrderText}> Place order</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.footerNote}>
          By ordering you accept delivery terms (mock).
        </Text>
      </ScrollView>

      <Modal visible={summaryOpen} transparent animationType="fade" onRequestClose={closeSummaryAndTrack}>
        <View style={styles.modalOverlay}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconWrap}>
              <Ionicons name="checkmark-circle" size={48} color={C.emerald600} />
            </View>
            <Text style={styles.summaryTitle}>Order summary</Text>
            <Text style={styles.summaryBody}>
              Total:{' '}
              <Text style={styles.summaryBold}>
                {formatKes(orderSnapshot ? orderSnapshot.total : total)}
              </Text>
              {'\n'}
              Type: {orderSnapshot?.orderType ?? orderType}
              {'\n'}
              Payment: {orderSnapshot?.paymentLabel ?? '—'}
              {'\n'}
              Time: {orderSnapshot?.scheduledTime ?? 'ASAP'}
              {'\n'}
              Promo: {orderSnapshot?.promo ?? 'none'}
              {'\n'}
              Plan: {orderSnapshot?.subscription ?? 'standard'}
              {'\n'}
              {orderSnapshot?.addressLine ? `Address: ${orderSnapshot.addressLine}` : ''}
              {orderSnapshot?.notes ? `\nNotes: ${orderSnapshot.notes}` : ''}
            </Text>
            <Text style={styles.summaryHint}>
              Cart cleared — opening live tracking now.
            </Text>
            {mpesaPrompt ? <Text style={styles.summaryHint}>{mpesaPrompt}</Text> : null}
            {paymentMethod === 'mpesa' ? (
              <Pressable style={styles.secondaryBtn} onPress={refreshMpesaStatus}>
                <Ionicons name="refresh-outline" size={18} color={C.cyan600} />
                <Text style={styles.secondaryBtnText}>
                  Refresh M-Pesa status ({paymentStatus || 'PENDING'})
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.primaryBtn} onPress={closeSummaryAndTrack}>
              <Text style={styles.primaryBtnText}>
                {paymentMethod === 'mpesa' && paymentStatus !== 'PAID'
                  ? 'Waiting for M-Pesa confirmation'
                  : 'Go to tracking'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.slate100,
  },
  mainScroll: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.slate200,
    backgroundColor: C.navy900,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#dbeafe',
  },
  scrollInner: {
    paddingHorizontal: 16,
    width: '100%',
  },
  brandLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 20,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  stepChip: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  stepChipTxt: {
    color: C.indigo600,
    fontSize: 11,
    fontWeight: '800',
  },
  brandEmoji: { fontSize: 28 },
  brandText: {
    fontSize: 18,
    fontWeight: '700',
    color: C.slate900,
  },
  brandSub: {
    fontSize: 12,
    color: C.slate600,
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e3f4',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.slate900,
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.slate200,
  },
  cartRowMain: { flex: 1, minWidth: 0 },
  cartName: { fontSize: 15, fontWeight: '600', color: C.slate900 },
  cartRestSmall: { marginTop: 2, fontSize: 11, fontWeight: '600', color: C.slate500 },
  rxLine: { marginTop: 2, fontSize: 11, fontWeight: '700', color: '#b45309' },
  rxInfo: { fontSize: 13, color: C.slate600, lineHeight: 19, marginBottom: 12 },
  rxUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
  },
  rxUploadBtnDone: {
    borderColor: '#a7f3d0',
    backgroundColor: '#ecfdf5',
  },
  rxUploadBtnTxt: { fontSize: 14, fontWeight: '700', color: C.slate800, flex: 1 },
  cartMeta: { marginTop: 4, fontSize: 13, color: C.slate600 },
  inlineQty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  inlineQtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    backgroundColor: C.slate50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineQtyTxt: { fontSize: 18, fontWeight: '800', color: C.indigo600, lineHeight: 20 },
  inlineQtyVal: { fontSize: 14, fontWeight: '800', color: C.slate900, minWidth: 20, textAlign: 'center' },
  cartRowEnd: { alignItems: 'flex-end' },
  cartLinePrice: { fontSize: 15, fontWeight: '700', color: C.slate900 },
  removeTxt: { marginTop: 6, fontSize: 12, fontWeight: '600', color: C.rose600 },
  divider: {
    height: 1,
    backgroundColor: C.slate200,
    marginVertical: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  totalMuted: { fontSize: 14, color: C.slate600 },
  totalVal: { fontSize: 14, fontWeight: '600', color: C.slate800 },
  grandRow: { marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.slate200 },
  grandLabel: { fontSize: 16, fontWeight: '700', color: C.slate900 },
  grandValue: { fontSize: 20, fontWeight: '800', color: C.cyan600 },
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: C.slate900,
    backgroundColor: C.slate50,
  },
  input: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.slate900,
    backgroundColor: C.slate50,
  },
  inputGap: {
    marginTop: 10,
  },
  tipText: {
    marginTop: 8,
    fontSize: 12,
    color: C.slate500,
  },
  primeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 4,
  },
  primeText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.slate700,
  },
  timeChips: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  timeChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.slate200,
    backgroundColor: C.slate50,
  },
  timeChipOn: {
    borderColor: C.indigo600,
    backgroundColor: '#e0e7ff',
  },
  timeChipTxt: { fontSize: 14, fontWeight: '700', color: C.slate600 },
  timeChipTxtOn: { color: C.indigo600 },
  asapHint: { fontSize: 13, color: C.slate600, lineHeight: 19 },
  errText: {
    marginTop: 8,
    fontSize: 13,
    color: C.rose600,
    fontWeight: '500',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cyan700,
    backgroundColor: '#ecfeff',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.cyan700,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    marginBottom: 8,
    backgroundColor: C.slate50,
  },
  payRowActive: {
    borderColor: C.indigo600,
    backgroundColor: '#e0e7ff',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.slate400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: { borderColor: C.cyan600 },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.indigo600,
  },
  payLabelCol: { flex: 1, gap: 6 },
  payLabel: { fontSize: 15, fontWeight: '600', color: C.slate700 },
  payLabelActive: { color: C.slate900 },
  recommendedPill: {
    alignSelf: 'flex-start',
    backgroundColor: K.redLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  recommendedPillTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: K.red,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.indigo600,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: C.indigo600,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  placeOrderText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '800',
  },
  btnDisabled: { opacity: 0.75 },
  pressed: { opacity: 0.92 },
  footerNote: {
    marginTop: 14,
    textAlign: 'center',
    fontSize: 12,
    color: C.slate500,
  },
  emptyWrap: {
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: C.slate900,
  },
  emptyHint: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 15,
    color: C.slate600,
    lineHeight: 22,
  },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: C.indigo600,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  summaryCard: {
    backgroundColor: C.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  summaryIconWrap: { marginBottom: 8 },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.slate900,
    marginBottom: 12,
  },
  summaryBody: {
    fontSize: 15,
    color: C.slate600,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryBold: { fontWeight: '800', color: C.slate900 },
  summaryHint: {
    marginTop: 12,
    fontSize: 13,
    color: C.slate500,
    textAlign: 'center',
  },
})
