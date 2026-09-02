import { createContext, useContext, useState, useCallback } from 'react'

const DICT = {
  vi: {
    home: 'Trang chủ',
    products: 'Sản phẩm',
    searchPlaceholder: 'Tìm sản phẩm...',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    account: 'Tài khoản',
    admin: 'Quản trị',
    wishlist: 'Wishlist',
    cart: 'Giỏ hàng',
    dashboard: 'Dashboard',
  },
  en: {
    home: 'Home',
    products: 'Products',
    searchPlaceholder: 'Search products...',
    login: 'Sign in',
    logout: 'Sign out',
    account: 'Account',
    admin: 'Admin',
    wishlist: 'Wishlist',
    cart: 'Cart',
    dashboard: 'Dashboard',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('lang') || 'vi' } catch { return 'vi' }
  })

  const setLang = useCallback((l) => {
    setLangState(l)
    try { localStorage.setItem('lang', l) } catch { /* ignore */ }
  }, [])

  const t = useCallback((key) => DICT[lang]?.[key] ?? DICT.vi[key] ?? key, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
