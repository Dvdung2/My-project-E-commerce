import { useEffect, useState } from 'react'
import { createOrder } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function CheckoutModal({ cart, totalAmount, onClose, onSuccess }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.email || '',
    shippingAddress: user?.address || ''
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setForm(prev => ({
      customerName: prev.customerName || user.fullName || '',
      customerEmail: prev.customerEmail || user.email || '',
      shippingAddress: prev.shippingAddress || user.address || ''
    }))
  }, [user])

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await createOrder({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        shippingAddress: form.shippingAddress,
        items: cart.map(i => ({ productId: i.id, quantity: i.qty }))
      })
      setDone(true)
      setTimeout(onSuccess, 2000)
    } catch (err) {
      setError(err.response?.data || 'Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {done ? (
          <div className="success-box">
            <div className="success-icon">✓</div>
            <div className="success-title">Đặt hàng thành công</div>
            <div className="success-sub">Chúng tôi sẽ liên hệ trong thời gian sớm nhất.</div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-head">
              <h2 className="modal-title">Thông tin đặt hàng</h2>
              <button type="button" className="btn-close" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Họ và tên</label>
                <input className="form-input" name="customerName" value={form.customerName}
                  onChange={set} placeholder="Nguyễn Văn A" required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="customerEmail" type="email" value={form.customerEmail}
                  onChange={set} placeholder="email@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Địa chỉ giao hàng</label>
                <input className="form-input" name="shippingAddress" value={form.shippingAddress}
                  onChange={set} placeholder="123 Đường ABC, Quận 1, TP.HCM" required />
              </div>

              <div className="order-sum">
                <div className="order-sum-title">Tóm tắt đơn hàng</div>
                {cart.map(i => (
                  <div key={i.id} className="order-sum-row">
                    <span>{i.name} × {i.qty}</span>
                    <span>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="order-sum-total">
                  <span>Tổng cộng</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {error && <div className="err-msg">{error}</div>}
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-sec" onClick={onClose}>Hủy</button>
              <button id="submit-order" type="submit" className="btn-primary" disabled={loading || cart.length === 0}>
                {loading ? 'Đang xử lý...' : cart.length === 0 ? 'Giỏ hàng trống' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
