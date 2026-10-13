import { apiRequest } from '../api/client'

export async function initiateMpesaSTK({ phone, amount, orderId }) {
  return apiRequest('/payments/mpesa/stkpush', {
    method: 'POST',
    body: JSON.stringify({ phone, amount, orderId }),
  })
}

export async function getOrderPaymentStatus(orderId) {
  return apiRequest(`/payments/order/${encodeURIComponent(orderId)}`)
}

