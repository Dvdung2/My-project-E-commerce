import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CartPanel from './components/CartPanel'
import CheckoutModal from './components/CheckoutModal'
import WishlistPanel from './components/WishlistPanel'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import Toast from './components/Toast'

const WISHLIST_KEY = 'shopvn_wishlist'

function RoleRedirect() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (user?.role === 'Admin' && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />
  }

  return null
}

export default function App() {
  const [cart, setCart] = useState([])
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []
    } catch {
      return []
    }
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

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist))
  }, [wishlist])

  const addToCart = (product, openCheckout = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
    
    if (openCheckout) {
      setCheckoutOpen(true)
    } else {
      showToast(`Đã thêm "${product.name}" vào giỏ hàng`)
    }
  }

  const toggleWishlist = (product) => {
    const exists = wishlist.some(i => i.id === product.id)
    setWishlist(prev => exists ? prev.filter(i => i.id !== product.id) : [{ ...product }, ...prev])
    showToast(exists ? `Đã bỏ "${product.name}" khỏi wishlist` : `Đã thêm "${product.name}" vào wishlist`)
  }

  const removeFromWishlist = (id) => {
    setWishlist(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))
  const clearCart = () => setCart([])

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const totalAmount = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <AuthProvider>
      <BrowserRouter>
        <RoleRedirect />
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
      </BrowserRouter>
    </AuthProvider>
  )
}
