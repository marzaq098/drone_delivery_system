import { apiRequest } from './client'

export const createOrderApi = (payload) =>
  apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

