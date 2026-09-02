import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile, getMyOrders, cancelOrder, changePassword,
  getAddresses, createAddress, deleteAddress, setDefaultAddress } from '../services/api'

const STATUS_LABEL = {
  0: 'Chờ xử lý', 1: 'Đang xử lý', 2: 'Đang giao', 3: 'Đã giao', 4: 'Đã hủy'
}

export default function ProfileModal({ onClose }) {
  const { user, logout, loginUser } = useAuth()
  const [tab, setTab] = useState('info')
  const [form, setForm] = useState({ fullName: user?.fullName || '', phone: user?.phone || '', address: user?.address || '' })
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' })
  const [pwdMsg, setPwdMsg] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [addrForm, setAddrForm] = useState({ recipient: '', phone: '', line: '', city: '' })

  const loadAddresses = () => getAddresses().then(r => setAddresses(r.data)).catch(console.error)
  useEffect(() => { if (tab === 'addresses') loadAddresses() }, [tab])

  const addAddress = async e => {
    e.preventDefault()
    try { await createAddress(addrForm); setAddrForm({ recipient: '', phone: '', line: '', city: '' }); loadAddresses() }
    catch (err) { alert(err.response?.data || 'Không lưu được địa chỉ') }
  }

  const set = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const loadOrders = () => {
    setLoading(true)
    getMyOrders().then(r => setOrders(r.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'orders') loadOrders()
  }, [tab])

  const doCancel = async (id) => {
    try { await cancelOrder(id); loadOrders() }
    catch (err) { alert(err.response?.data || 'Không hủy được đơn') }
  }

  const savePassword = async e => {
    e.preventDefault(); setPwdMsg(null)
    try {
      await changePassword(pwd)
      setPwd({ currentPassword: '', newPassword: '' })
      setPwdMsg({ type: 'ok', text: 'Đổi mật khẩu thành công.' })
    } catch (err) {
      setPwdMsg({ type: 'err', text: err.response?.data || 'Có lỗi xảy ra.' })
    }
  }

  const saveProfile = async e => {
    e.preventDefault(); setSaving(true); setMsg(null)
    try {
      const res = await updateProfile(form)
      loginUser(localStorage.getItem('token'), res.data)
      setMsg({ type: 'ok', text: 'Cập nhật thành công.' })
    } catch {
      setMsg({ type: 'err', text: 'Có lỗi xảy ra.' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => { logout(); onClose() }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Tài khoản</h2>
            <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginTop: '.1rem' }}>{user?.email} · {user?.role}</div>
          </div>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button onClick={handleLogout} style={{
              background: 'none', border: '1px solid var(--line)', color: 'var(--text3)',
              padding: '.35rem .8rem', borderRadius: 'var(--r3)', cursor: 'pointer',
              fontSize: '.75rem', fontFamily: 'Inter,sans-serif', transition: 'var(--t)'
            }}>Đăng xuất</button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
          {['info', 'orders', 'addresses', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '.75rem', background: 'none', border: 'none',
              borderBottom: tab === t ? '1px solid var(--text)' : '1px solid transparent',
              color: tab === t ? 'var(--white)' : 'var(--text3)',
              fontSize: '.8rem', fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              transition: 'var(--t)', marginBottom: '-1px'
            }}>
              {t === 'info' ? 'Thông tin cá nhân' : t === 'orders' ? 'Đơn hàng' : t === 'addresses' ? 'Địa chỉ' : 'Mật khẩu'}
            </button>
          ))}
        </div>

        {/* Info Tab */}
        {tab === 'info' && (
          <form onSubmit={saveProfile}>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.85rem' }}>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Họ và tên</label>
                  <input className="form-input" name="fullName" value={form.fullName} onChange={set} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={user?.email} disabled style={{ opacity: .5 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={set} placeholder="0901234567" />
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Địa chỉ</label>
                  <input className="form-input" name="address" value={form.address} onChange={set} placeholder="123 Đường ABC..." />
                </div>
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--text3)' }}>
                Thành viên từ: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
              </div>
              {msg && (
                <div className={msg.type === 'ok' ? 'form-input' : 'err-msg'}
                  style={msg.type === 'ok' ? { color: 'var(--ok)', background: 'rgba(94,203,138,.08)', border: '1px solid rgba(94,203,138,.2)', fontSize: '.8rem', cursor: 'default' } : {}}>
                  {msg.text}
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-sec" onClick={onClose}>Đóng</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: '.85rem' }}>Đang tải...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                <div style={{ fontSize: '2rem', opacity: .2, marginBottom: '.5rem' }}>○</div>
                <p style={{ fontSize: '.85rem' }}>Chưa có đơn hàng nào</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)',
                padding: '.9rem', marginBottom: '.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                  <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--white)' }}>Đơn #{order.id}</span>
                  <span style={{
                    fontSize: '.68rem', padding: '.15rem .55rem',
                    borderRadius: '50px', background: 'var(--bg3)',
                    color: 'var(--text3)', border: '1px solid var(--line)'
                  }}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--text3)', marginBottom: '.5rem' }}>
                  {new Date(order.createdAt).toLocaleDateString('vi-VN')} — {order.shippingAddress}
                </div>
                {order.orderItems?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', color: 'var(--text2)', padding: '.2rem 0' }}>
                    <span>{item.product?.name} × {item.quantity}</span>
                    <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem', fontWeight: 700, color: 'var(--white)', marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid var(--line)' }}>
                  <span>Tổng</span>
                  <span>${order.totalAmount?.toFixed(2)}</span>
                </div>
                {order.status === 0 && (
                  <button onClick={() => doCancel(order.id)} style={{
                    marginTop: '.6rem', width: '100%', background: 'none',
                    border: '1px solid rgba(239,68,68,.35)', color: '#ef4444',
                    padding: '.4rem', borderRadius: 'var(--r3)', cursor: 'pointer',
                    fontSize: '.75rem', fontFamily: 'Inter,sans-serif'
                  }}>Hủy đơn hàng</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Addresses Tab */}
        {tab === 'addresses' && (
          <div className="modal-body" style={{ maxHeight: '440px', overflowY: 'auto' }}>
            {addresses.map(a => (
              <div key={a.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r2)', padding: '.8rem', marginBottom: '.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '.82rem', color: 'var(--white)' }}>
                    {a.recipient} · {a.phone} {a.isDefault && <span style={{ color: '#4ade80', fontSize: '.7rem' }}>(mặc định)</span>}
                  </strong>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {!a.isDefault && <button onClick={() => setDefaultAddress(a.id).then(loadAddresses)} style={{ background: 'none', border: '1px solid var(--line)', color: 'var(--text3)', borderRadius: 'var(--r3)', fontSize: '.68rem', padding: '.2rem .5rem', cursor: 'pointer' }}>Đặt mặc định</button>}
                    <button onClick={() => deleteAddress(a.id).then(loadAddresses)} style={{ background: 'none', border: '1px solid rgba(239,68,68,.35)', color: '#ef4444', borderRadius: 'var(--r3)', fontSize: '.68rem', padding: '.2rem .5rem', cursor: 'pointer' }}>Xóa</button>
                  </div>
                </div>
                <div style={{ fontSize: '.76rem', color: 'var(--text3)', marginTop: '.3rem' }}>{a.line}{a.city ? `, ${a.city}` : ''}</div>
              </div>
            ))}
            <form onSubmit={addAddress} style={{ marginTop: '.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.6rem' }}>
              <input className="form-input" placeholder="Người nhận" required value={addrForm.recipient} onChange={e => setAddrForm(p => ({ ...p, recipient: e.target.value }))} />
              <input className="form-input" placeholder="Số điện thoại" required value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} />
              <input className="form-input" style={{ gridColumn: '1/-1' }} placeholder="Địa chỉ" required value={addrForm.line} onChange={e => setAddrForm(p => ({ ...p, line: e.target.value }))} />
              <input className="form-input" placeholder="Thành phố" value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} />
              <button type="submit" className="btn-primary">Thêm địa chỉ</button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <form onSubmit={savePassword}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input className="form-input" type="password" required
                  value={pwd.currentPassword} onChange={e => setPwd(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                <input className="form-input" type="password" required minLength={6}
                  value={pwd.newPassword} onChange={e => setPwd(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              {pwdMsg && <div className={pwdMsg.type === 'ok' ? 'ok-msg' : 'err-msg'}>{pwdMsg.text}</div>}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-sec" onClick={onClose}>Đóng</button>
              <button type="submit" className="btn-primary">Đổi mật khẩu</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
