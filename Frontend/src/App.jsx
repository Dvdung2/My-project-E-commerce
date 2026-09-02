import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import * as signalR from '@microsoft/signalr'
import { AuthProvider, useAuth } from '@/shared/context/AuthContext'
import { I18nProvider } from '@/shared/context/I18nContext'
import {
  getCart, addToCartApi, updateCartApi, removeFromCartApi, clearCartApi,
  getWishlistApi, toggleWishlistApi, removeWishlistApi
} from '@/shared/services/api'
import Navbar from '@/customer/components/Navbar'
import HomePage from '@/customer/pages/HomePage'
import ProductsPage from '@/customer/pages/ProductsPage'
import ProductDetailPage from '@/customer/pages/ProductDetailPage'
import AdminDashboardPage from '@/admin/pages/AdminDashboardPage'
import CartPanel from '@/customer/components/CartPanel'
import CheckoutModal from '@/customer/components/CheckoutModal'
import WishlistPanel from '@/customer/components/WishlistPanel'
import AuthModal from '@/customer/components/AuthModal'
import ProfileModal from '@/customer/components/ProfileModal'
import Toast from '@/shared/components/Toast'

const WISHLIST_KEY = 'shopvn_wishlist'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const HUB_URL = API_BASE.replace(/\/api$/, '') + '/hubs/orders'
const STATUS_LABELS = ['Chờ xử lý', 'Đang xử lý', 'Đang giao', 'Đã giao', 'Đã hủy']

// Normalize a server cart item to the shape the UI uses.
const normCart = (c) => ({ id: c.productId, name: c.name, price: c.price, imageUrl: c.imageUrl, stock: c.stock, qty: c.quantity })

function RoleRedirect() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (user?.role === 'Admin' && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />
  }
  return null
}

function AppContent() {
  const { user } = useAuth()
  const isCustomer = user?.role === 'Customer'

  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [] } catch { return [] }
  })
  const [cartOpen, setCartOpen] = useState(false)
  const [wishlistOpen, setWishlistOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const [catalogVersion, setCatalogVersion] = useState(0)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // Persist guest wishlist locally; logged-in wishlist lives on the server.
  useEffect(() => {
    if (!isCustomer) localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist, isCustomer])

  // Realtime order notifications via SignalR while logged in.
  useEffect(() => {
    if (!user) return
    const token = localStorage.getItem('token')
    if (!token) return
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem('token') })
      .withAutomaticReconnect()
      .build()

    conn.on('orderStatusChanged', p => {
      showToast(`Đơn #${p.id}: ${STATUS_LABELS[p.statusValue] || p.status}`)
    })
    conn.on('orderCreated', p => {
      showToast(`Đơn hàng mới #${p.id} · $${p.totalAmount?.toFixed?.(2) ?? p.totalAmount}`)
    })
    conn.start().catch(err => console.error('SignalR:', err))

    return () => { conn.stop().catch(() => {}) }
  }, [user?.id])

  // Load server cart & wishlist on customer login; clear cart on logout.
  useEffect(() => {
    let active = true
    if (isCustomer) {
      Promise.all([getCart(), getWishlistApi()])
        .then(([c, w]) => { if (active) { setCart(c.data.map(normCart)); setWishlist(w.data) } })
        .catch(e => console.error(e))
    } else {
      setCart([])
    }
    return () => { active = false }
  }, [isCustomer, user?.id])

  const addToCart = async (product, openCheckout = false) => {
    if (isCustomer) {
      try {
        const res = await addToCartApi(product.id, 1)
        setCart(res.data.map(normCart))
      } catch (err) { showToast(err.response?.data || 'Không thêm được vào giỏ'); return }
    } else {
      setCart(prev => {
        const existing = prev.find(i => i.id === product.id)
        if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        return [...prev, { ...product, qty: 1 }]
      })
    }
    if (openCheckout) setCheckoutOpen(true)
    else showToast(`Đã thêm "${product.name}" vào giỏ hàng`)
  }

  const toggleWishlist = async (product) => {
    const exists = wishlist.some(i => i.id === product.id)
    if (isCustomer) {
      try {
        const res = await toggleWishlistApi(product.id)
        setWishlist(res.data)
      } catch (err) { showToast(err.response?.data || 'Lỗi wishlist'); return }
    } else {
      setWishlist(prev => exists ? prev.filter(i => i.id !== product.id) : [{ ...product }, ...prev])
    }
    showToast(exists ? `Đã bỏ "${product.name}" khỏi wishlist` : `Đã thêm "${product.name}" vào wishlist`)
  }

  const removeFromWishlist = async (id) => {
    if (isCustomer) {
      try { const res = await removeWishlistApi(id); setWishlist(res.data) } catch (e) { console.error(e) }
    } else {
      setWishlist(prev => prev.filter(i => i.id !== id))
    }
  }

  const updateQty = async (id, delta) => {
    const item = cart.find(i => i.id === id)
    if (!item) return
    const newQty = Math.max(1, item.qty + delta)
    if (isCustomer) {
      try { const res = await updateCartApi(id, newQty); setCart(res.data.map(normCart)) } catch (err) { showToast(err.response?.data || 'Lỗi cập nhật giỏ') }
    } else {
      setCart(prev => prev.map(i => i.id === id ? { ...i, qty: newQty } : i))
    }
  }

  const removeFromCart = async (id) => {
    if (isCustomer) {
      try { const res = await removeFromCartApi(id); setCart(res.data.map(normCart)) } catch (e) { console.error(e) }
    } else {
      setCart(prev => prev.filter(i => i.id !== id))
    }
  }

  const clearCart = async () => {
    if (isCustomer) { try { await clearCartApi() } catch (e) { console.error(e) } }
    setCart([])
  }

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <>
      <RoleRedirect />
      {user?.role !== 'Admin' && (
        <Navbar
          totalItems={totalItems}
          onCartClick={() => setCartOpen(true)}
          totalWishlist={wishlist.length}
          onWishlistClick={() => setWishlistOpen(true)}
          search={search}
          setSearch={setSearch}
          onAuthClick={() => setAuthOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={
          <ProductsPage
            search={search}
            addToCart={addToCart}
            catalogVersion={catalogVersion}
            wishlistIds={wishlist.map(i => i.id)}
            toggleWishlist={toggleWishlist}
          />
        } />
        <Route path="/admin" element={<AdminDashboardPage onChanged={() => setCatalogVersion(v => v + 1)} />} />
        <Route path="/product/:id" element={
          <ProductDetailPage
            addToCart={addToCart}
            wishlistIds={wishlist.map(i => i.id)}
            toggleWishlist={toggleWishlist}
          />
        } />
      </Routes>

      {cartOpen && (
        <CartPanel
          cart={cart} totalAmount={totalAmount}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty} onRemove={removeFromCart}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
        />
      )}
      {wishlistOpen && (
        <WishlistPanel
          items={wishlist}
          onClose={() => setWishlistOpen(false)}
          onRemove={removeFromWishlist}
          onAddToCart={addToCart}
        />
      )}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart} totalAmount={totalAmount}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => { clearCart(); setCheckoutOpen(false); showToast('Đặt hàng thành công!') }}
        />
      )}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}
      {toast && <Toast message={toast} />}
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  )
}
