import { apiRequest } from './client'

export const getProductsApi = () => apiRequest('/products')
export const getVendorsApi = () => apiRequest('/vendors')
export const getVendorProductsApi = (id) => apiRequest(`/vendors/${encodeURIComponent(id)}/products`)

