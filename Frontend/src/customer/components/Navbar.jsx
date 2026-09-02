import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext'
import { useI18n } from '@/shared/context/I18nContext'

function LangToggle() {
  const { lang, setLang } = useI18n()
  return (
    <button className="btn-ghost" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} title="Language">
      {lang === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
    </button>
  )
}

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
  const { t } = useI18n()
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
          <LangToggle />
          <button className="btn-ghost" onClick={handleLogout}>{t('logout')}</button>
        </div>
      </nav>
    )
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">SHOPVN</Link>

      <div className="navbar-links">
        <Link to="/">{t('home')}</Link>
        <Link to="/products">{t('products')}</Link>
      </div>

      <div className="navbar-search">
        <span className="search-icon">🔍</span>
        <input
          id="search-input"
          type="text"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={handleSearch}
          onFocus={() => {
            if (search && location.pathname !== '/products') navigate('/products')
          }}
        />
      </div>

      <div className="navbar-actions">
        <LangToggle />
        {user ? (
          <>
            {user.role === 'Admin' && (
              <button id="admin-button" className="btn-ghost" onClick={() => navigate('/admin')}>
                {t('admin')}
              </button>
            )}
            <button id="profile-button" className="btn-ghost" onClick={onProfileClick}
              title={user.email}>
              {user.fullName?.split(' ').pop() || t('account')}
            </button>
          </>
        ) : (
          <button id="login-button" className="btn-ghost" onClick={onAuthClick}>
            {t('login')}
          </button>
        )}
        <button id="wishlist-button" className="btn-ghost wishlist-nav" onClick={onWishlistClick}>
          {t('wishlist')} ({totalWishlist})
          {totalWishlist > 0 && <span className="wishlist-dot">{totalWishlist}</span>}
        </button>
        <button id="cart-button" className="cart-btn" onClick={onCartClick}>
          {t('cart')} ({totalItems})
          {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
        </button>
      </div>
    </nav>
  )
}
