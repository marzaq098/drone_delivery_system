const payments = new Map()
const orders = new Map()

function upsertOrder(orderId, patch) {
  const prev = orders.get(orderId) || { orderId, payment_status: 'PENDING' }
  const next = { ...prev, ...patch, updated_at: new Date().toISOString() }
  orders.set(orderId, next)
  return next
}

function createPayment(record) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const next = {
    id,
    method: 'MPESA',
    status: 'PENDING',
    created_at: new Date().toISOString(),
    ...record,
  }
  payments.set(id, next)
  return next
}

function findPaymentByCheckoutRequestId(checkoutRequestId) {
  for (const p of payments.values()) {
    if (p.checkout_request_id === checkoutRequestId) return p
  }
  return null
}

function updatePayment(id, patch) {
  const prev = payments.get(id)
  if (!prev) return null
  const next = { ...prev, ...patch, updated_at: new Date().toISOString() }
  payments.set(id, next)
  return next
}

function getOrder(orderId) {
  return orders.get(orderId) || null
}

module.exports = {
  upsertOrder,
  createPayment,
  findPaymentByCheckoutRequestId,
  updatePayment,
  getOrder,
}

