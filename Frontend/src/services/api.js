import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
})

// Attach token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On a 401, try once to refresh the access token with the refresh token,
// then replay the original request.
let refreshing = null
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    const refreshToken = localStorage.getItem('refreshToken')
    const isAuthCall = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login')
    if (error.response?.status === 401 && refreshToken && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshing = refreshing || axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken })
        const { data } = await refreshing
        refreshing = null
        localStorage.setItem('token', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)
        original.headers.Authorization = `Bearer ${data.token}`
        return api(original)
      } catch (e) {
        refreshing = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      }
    }
    return Promise.reject(error)
  }
)

export const getProducts = (params) => api.get('/products', { params })
export const getProductById = (id) => api.get(`/products/${id}`)
export const uploadImage = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/uploads', fd, { headers: { 'Content-Type': undefined } })
}
export const addProductImage = (productId, url) => api.post(`/products/${productId}/images`, { url })
export const deleteProductImage = (imageId) => api.delete(`/products/images/${imageId}`)
export const getRelated = (id) => api.get(`/products/${id}/related`)
export const getProductsByIds = (ids) => api.get('/products/by-ids', { params: { ids: ids.join(',') } })
export const getCategories = () => api.get('/categories')
export const createCategory = (data) => api.post('/categories', data)
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)
export const createProduct = (data) => api.post('/products', data)
export const updateProduct = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)
export const createOrder = (data) => api.post('/orders', data)
export const getOrders = () => api.get('/orders')
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status })
// Cart (server-side, logged-in customers)
export const getCart = () => api.get('/cart')
export const addToCartApi = (productId, quantity = 1) => api.post('/cart', { productId, quantity })
export const updateCartApi = (productId, quantity) => api.put(`/cart/${productId}`, { productId, quantity })
export const removeFromCartApi = (productId) => api.delete(`/cart/${productId}`)
export const clearCartApi = () => api.delete('/cart')

// Wishlist (server-side, logged-in customers)
export const getWishlistApi = () => api.get('/wishlist')
export const toggleWishlistApi = (productId) => api.post(`/wishlist/${productId}`)
export const removeWishlistApi = (productId) => api.delete(`/wishlist/${productId}`)

export const getAddresses = () => api.get('/addresses')
export const createAddress = (data) => api.post('/addresses', data)
export const deleteAddress = (id) => api.delete(`/addresses/${id}`)
export const setDefaultAddress = (id) => api.patch(`/addresses/${id}/default`)
export const refreshTokenApi = (refreshToken) => api.post('/auth/refresh', { refreshToken })
export const logoutApi = (refreshToken) => api.post('/auth/logout', { refreshToken })
export const validateCoupon = (code, subtotal) => api.get('/coupons/validate', { params: { code, subtotal } })
export const getCoupons = () => api.get('/coupons')
export const createCoupon = (data) => api.post('/coupons', data)
export const deleteCoupon = (id) => api.delete(`/coupons/${id}`)
export const cancelOrder = (id) => api.post(`/orders/${id}/cancel`)
export const changePassword = (data) => api.post('/auth/change-password', data)

export const getReviews = (productId) => api.get(`/products/${productId}/reviews`)
export const submitReview = (productId, data) => api.post(`/products/${productId}/reviews`, data)
export const getAnalytics = () => api.get('/analytics/summary')
export const getUsers = () => api.get('/users')
export const updateUserRole = (id, role) => api.patch(`/users/${id}/role`, { role })
export const deleteUser = (id) => api.delete(`/users/${id}`)

// Auth
export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)
export const getMe = () => api.get('/auth/me')
export const updateProfile = (data) => api.put('/auth/profile', data)
export const getMyOrders = () => api.get('/auth/my-orders')

export default api
