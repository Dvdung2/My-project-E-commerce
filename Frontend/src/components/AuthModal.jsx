import { useState } from 'react'
import { login, register } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function AuthModal({ mode: initialMode, onClose }) {
  const [mode, setMode] = useState(initialMode || 'login')
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { loginUser } = useAuth()

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const fn = mode === 'login' ? login : register
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : { fullName: form.fullName, email: form.email, password: form.password, phone: form.phone, address: form.address }
      const res = await fn(payload)
      loginUser(res.data.token, res.data.user, res.data.refreshToken)
      onClose()
    } catch (err) {
      setError(err.response?.data || 'Đã có lỗi xảy ra.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 className="modal-title">
            {mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="modal-body">
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" name="fullName" value={form.fullName}
                  onChange={set} placeholder="Nguyễn Văn A" required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" name="email" type="email" value={form.email}
                onChange={set} placeholder="email@example.com" required />
            </div>
            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <input className="form-input" name="password" type="password" value={form.password}
                onChange={set} placeholder="••••••••" required minLength={6} />
            </div>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-input" name="phone" value={form.phone}
                    onChange={set} placeholder="0901234567" />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <input className="form-input" name="address" value={form.address}
                    onChange={set} placeholder="123 Đường ABC, Quận 1, TP.HCM" />
                </div>
              </>
            )}
            {error && <div className="err-msg">{typeof error === 'string' ? error : JSON.stringify(error)}</div>}
            <div style={{ fontSize: '.8rem', color: 'var(--text3)', textAlign: 'center' }}>
              {mode === 'login' ? (
                <>Chưa có tài khoản?{' '}
                  <button type="button" onClick={() => { setMode('register'); setError(null) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', fontSize: '.8rem' }}>
                    Đăng ký
                  </button>
                </>
              ) : (
                <>Đã có tài khoản?{' '}
                  <button type="button" onClick={() => { setMode('login'); setError(null) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', fontSize: '.8rem' }}>
                    Đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-sec" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
