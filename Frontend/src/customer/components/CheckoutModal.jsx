import { useEffect, useState } from 'react'
import { createOrder, validateCoupon, getAddresses } from '@/shared/services/api'
import { useAuth } from '@/shared/context/AuthContext'

const FREE_SHIP_THRESHOLD = 100
const FLAT_SHIP = 5

export default function CheckoutModal({ cart, totalAmount, onClose, onSuccess }) {
  const { user } = useAuth()
  // Name and email come from the authenticated user (the backend derives them
  // from the JWT); only the shipping address is collected here.
  const [shippingAddress, setShippingAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState(null) // { code, discountAmount }
  const [couponMsg, setCouponMsg] = useState(null)
  const [addresses, setAddresses] = useState([])

  useEffect(() => {
    if (user?.address) setShippingAddress(prev => prev || user.address)
    getAddresses().then(r => {
      setAddresses(r.data)
      const def = r.data.find(a => a.isDefault) || r.data[0]
      if (def) setShippingAddress(prev => prev || `${def.recipient}, ${def.phone}, ${def.line}${def.city ? ', ' + def.city : ''}`)
    }).catch(() => {})
  }, [user])

  const applyCoupon = async () => {
    setCouponMsg(null)
    if (!couponInput.trim()) return
    try {
      const res = await validateCoupon(couponInput.trim(), totalAmount)
      setCoupon(res.data)
      setCouponMsg({ ok: true, text: `Áp dụng ${res.data.discountPercent}% (-$${res.data.discountAmount.toFixed(2)})` })
    } catch (err) {
      setCoupon(null)
      setCouponMsg({ ok: false, text: err.response?.data || 'Mã không hợp lệ.' })
    }
  }

  const discount = coupon?.discountAmount || 0
  const discountedSubtotal = Math.max(0, totalAmount - discount)
  const shippingFee = discountedSubtotal >= FREE_SHIP_THRESHOLD ? 0 : FLAT_SHIP
  const payable = discountedSubtotal + shippingFee

  const submit = async e => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      await createOrder({
        shippingAddress,
        couponCode: coupon?.code || undefined,
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
                <input className="form-input" value={user?.fullName || ''} disabled readOnly />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={user?.email || ''} disabled readOnly />
              </div>
              {addresses.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Chọn từ sổ địa chỉ</label>
                  <select className="form-input" onChange={e => {
                    const a = addresses.find(x => x.id === Number(e.target.value))
                    if (a) setShippingAddress(`${a.recipient}, ${a.phone}, ${a.line}${a.city ? ', ' + a.city : ''}`)
                  }}>
                    <option value="">— Nhập thủ công —</option>
                    {addresses.map(a => (
                      <option key={a.id} value={a.id}>{a.recipient} · {a.line}{a.isDefault ? ' (mặc định)' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Địa chỉ giao hàng</label>
                <input className="form-input" name="shippingAddress" value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="123 Đường ABC, Quận 1, TP.HCM" required />
              </div>

              {!user && (
                <div className="err-msg">Vui lòng đăng nhập để đặt hàng.</div>
              )}

              <div className="form-group">
                <label className="form-label">Mã giảm giá</label>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <input className="form-input" value={couponInput} placeholder="VD: SAVE10"
                    onChange={e => setCouponInput(e.target.value.toUpperCase())} style={{ flex: 1 }} />
                  <button type="button" className="btn-sec" onClick={applyCoupon}>Áp dụng</button>
                </div>
                {couponMsg && <div className={couponMsg.ok ? 'ok-msg' : 'err-msg'} style={{ marginTop: '.4rem' }}>{couponMsg.text}</div>}
              </div>

              <div className="order-sum">
                <div className="order-sum-title">Tóm tắt đơn hàng</div>
                {cart.map(i => (
                  <div key={i.id} className="order-sum-row">
                    <span>{i.name} × {i.qty}</span>
                    <span>${(i.price * i.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="order-sum-row">
                  <span>Tạm tính</span>
                  <span>${totalAmount.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="order-sum-row" style={{ color: '#4ade80' }}>
                    <span>Giảm giá ({coupon.code})</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="order-sum-row">
                  <span>Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : `$${shippingFee.toFixed(2)}`}</span>
                </div>
                <div className="order-sum-total">
                  <span>Tổng cộng</span>
                  <span>${payable.toFixed(2)}</span>
                </div>
              </div>

              {error && <div className="err-msg">{error}</div>}
            </div>

            <div className="modal-foot">
              <button type="button" className="btn-sec" onClick={onClose}>Hủy</button>
              <button id="submit-order" type="submit" className="btn-primary" disabled={loading || cart.length === 0 || !user}>
                {loading ? 'Đang xử lý...' : cart.length === 0 ? 'Giỏ hàng trống' : 'Xác nhận đặt hàng'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
