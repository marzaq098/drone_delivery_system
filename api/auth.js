import { apiRequest } from './client'

export function registerApi(payload) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function loginApi(payload) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
