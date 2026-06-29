import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar({
  totalItems,
  onCartClick,
  totalWishlist,
  onWishlistClick,
  search,
  setSearch,
  onAuthClick,
  onProfileClick
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSearch = (e) => {
    setSearch(e.target.value)
    if (location.pathname !== '/products') navigate('/products')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (user?.role === 'Admin') {
    return (
      <nav className="navbar admin-only-nav">
        <Link to="/admin" className="navbar-logo">SHOPVN Admin</Link>

        <div className="navbar-links">
          <Link to="/admin">Dashboard</Link>
        </div>

        <div className="navbar-actions">
          <span className="admin-nav-user">{user.email}</span>
          <button className="btn-ghost" onClick={handleLogout}>Đăng xuất</button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">SHOPVN</Link>

      <div className="navbar-links">
        <Link to="/">Trang chủ</Link>
        <Link to="/products">Sản phẩm</Link>
      </div>

      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <input
          id="search-input"
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={handleSearch}
          onFocus={() => {
            if (search && location.pathname !== '/products') navigate('/products')
          }}
        />
      </div>

      <div className="navbar-actions">
        {user ? (
          <>
            {user.role === 'Admin' && (
              <button id="admin-button" className="btn-ghost" onClick={() => navigate('/admin')}>
                Quản trị
              </button>
            )}
            <button id="profile-button" className="btn-ghost" onClick={onProfileClick}
              title={user.email}>
              {user.fullName?.split(' ').pop() || 'Tài khoản'}
            </button>
          </>
        ) : (
          <button id="login-button" className="btn-ghost" onClick={onAuthClick}>
            Đăng nhập
          </button>
        )}
        <button id="wishlist-button" className="btn-ghost wishlist-nav" onClick={onWishlistClick}>
          Wishlist ({totalWishlist})
          {totalWishlist > 0 && <span className="wishlist-dot">{totalWishlist}</span>}
        </button>
        <button id="cart-button" className="cart-btn" onClick={onCartClick}>
          Giỏ hàng ({totalItems})
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>
    </nav>
  )
}
