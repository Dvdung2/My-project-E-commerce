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

export const getProducts = (params) => api.get('/products', { params })
export const getProductById = (id) => api.get(`/products/${id}`)
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

export const getReviews = (productId) => api.get(`/products/${productId}/reviews`)
export const submitReview = (productId, data) => api.post(`/products/${productId}/reviews`, data)
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
