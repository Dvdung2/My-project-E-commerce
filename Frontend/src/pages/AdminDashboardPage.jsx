import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  deleteUser,
  getCategories,
  getOrders,
  getProducts,
  getUsers,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateUserRole
} from '../services/api'

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  stock: '',
  categoryId: ''
}

const EMPTY_CATEGORY = { name: '', imageUrl: '' }

const STATUS_LABEL = {
  0: 'Chờ xử lý',
  1: 'Đang xử lý',
  2: 'Đang giao',
  3: 'Đã giao',
  4: 'Đã hủy'
}

function apiError(err) {
  const data = err.response?.data
  if (typeof data === 'string') return data
  if (data?.errors) return Object.values(data.errors).flat().join(' ')
  return 'Có lỗi xảy ra. Vui lòng thử lại.'
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`
}

export default function AdminDashboardPage({ onChanged }) {
  const { user, loading: authLoading } = useAuth()
  const [tab, setTab] = useState('overview')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [productId, setProductId] = useState(null)
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [categoryId, setCategoryId] = useState(null)
  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const selectedProduct = useMemo(
    () => products.find(p => p.id === productId),
    [products, productId]
  )

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === categoryId),
    [categories, categoryId]
  )

  const stats = useMemo(() => {
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
    const pending = orders.filter(order => order.status === 0 || order.status === 1).length
    const lowStock = products.filter(product => product.stock <= 5).length
    const admins = users.filter(item => item.role === 'Admin').length

    return [
      ['Doanh thu', money(revenue)],
      ['Đơn cần xử lý', pending],
      ['Sắp hết hàng', lowStock],
      ['Người dùng', `${users.length} (${admins} admin)`]
    ]
  }, [orders, products, users])

  const lowStockProducts = useMemo(
    () => products.filter(product => product.stock <= 5).slice(0, 6),
    [products]
  )

  const recentOrders = useMemo(
    () => orders.slice(0, 5),
    [orders]
  )

  const load = async () => {
    if (user?.role !== 'Admin') return
    setLoading(true)
    setMessage(null)
    try {
      const [p, c, o, u] = await Promise.all([getProducts({ pageSize: 100 }), getCategories(), getOrders(), getUsers()])
      setProducts(p.data.items)
      setCategories(c.data)
      setOrders(o.data)
      setUsers(u.data)
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) load()
  }, [authLoading, user?.role])

  useEffect(() => {
    if (!selectedProduct) {
      setProductForm(EMPTY_PRODUCT)
      return
    }

    setProductForm({
      name: selectedProduct.name || '',
      description: selectedProduct.description || '',
      price: selectedProduct.price ?? '',
      imageUrl: selectedProduct.imageUrl || '',
      stock: selectedProduct.stock ?? '',
      categoryId: selectedProduct.categoryId || ''
    })
  }, [selectedProduct])

  useEffect(() => {
    if (!selectedCategory) {
      setCategoryForm(EMPTY_CATEGORY)
      return
    }

    setCategoryForm({
      name: selectedCategory.name || '',
      imageUrl: selectedCategory.imageUrl || ''
    })
  }, [selectedCategory])

  if (authLoading) {
    return <main className="admin-shell"><div className="admin-loading">Đang kiểm tra quyền truy cập...</div></main>
  }

  if (!user) {
    return (
      <main className="admin-shell">
        <div className="admin-access">
          <h1>Đăng nhập admin</h1>
          <p>Bạn cần đăng nhập tài khoản admin để vào dashboard.</p>
          <Link className="btn-outline home-link" to="/">Về trang chủ</Link>
        </div>
      </main>
    )
  }

  if (user.role !== 'Admin') {
    return (
      <main className="admin-shell">
        <div className="admin-access">
          <h1>Không có quyền truy cập</h1>
          <p>Tài khoản hiện tại không phải admin.</p>
          <Link className="btn-outline home-link" to="/">Về trang chủ</Link>
        </div>
      </main>
    )
  }

  const setProductField = e => {
    const { name, value } = e.target
    setProductForm(prev => ({ ...prev, [name]: value }))
  }

  const setCategoryField = e => {
    const { name, value } = e.target
    setCategoryForm(prev => ({ ...prev, [name]: value }))
  }

  const productPayload = {
    ...productForm,
    price: Number(productForm.price),
    stock: Number(productForm.stock),
    categoryId: Number(productForm.categoryId)
  }

  const saveProduct = async e => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      if (productId) {
        await updateProduct(productId, productPayload)
      } else {
        await createProduct(productPayload)
        setProductForm(EMPTY_PRODUCT)
      }
      await load()
      onChanged()
      setMessage({ type: 'ok', text: productId ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async () => {
    if (!productId) return
    setSaving(true)
    setMessage(null)
    try {
      await deleteProduct(productId)
      setProductId(null)
      await load()
      onChanged()
      setMessage({ type: 'ok', text: 'Đã xóa sản phẩm.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setSaving(false)
    }
  }

  const saveCategory = async e => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      if (categoryId) {
        await updateCategory(categoryId, categoryForm)
      } else {
        await createCategory(categoryForm)
        setCategoryForm(EMPTY_CATEGORY)
      }
      await load()
      onChanged()
      setMessage({ type: 'ok', text: categoryId ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setSaving(false)
    }
  }

  const removeCategory = async () => {
    if (!categoryId) return
    setSaving(true)
    setMessage(null)
    try {
      await deleteCategory(categoryId)
      setCategoryId(null)
      await load()
      onChanged()
      setMessage({ type: 'ok', text: 'Đã xóa danh mục.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (orderId, status) => {
    setMessage(null)
    try {
      await updateOrderStatus(orderId, Number(status))
      await load()
      setMessage({ type: 'ok', text: `Đã cập nhật đơn #${orderId}.` })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    }
  }

  const changeRole = async (userId, role) => {
    setMessage(null)
    try {
      await updateUserRole(userId, role)
      await load()
      setMessage({ type: 'ok', text: 'Đã cập nhật quyền người dùng.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    }
  }

  const removeUser = async (userId) => {
    setMessage(null)
    try {
      await deleteUser(userId)
      await load()
      setMessage({ type: 'ok', text: 'Đã xóa người dùng.' })
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    }
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">SHOPVN Admin</div>
          <div className="admin-user">{user.email}</div>
        </div>
        <nav>
          {[
            ['overview', 'Tổng quan'],
            ['products', 'Sản phẩm'],
            ['categories', 'Danh mục'],
            ['orders', 'Đơn hàng'],
            ['users', 'Người dùng']
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-main">
        <div className="admin-topbar">
          <div>
            <div className="section-label">Quản trị hệ thống</div>
            <h1>{tab === 'overview' ? 'Dashboard' : tab === 'products' ? 'Sản phẩm' : tab === 'categories' ? 'Danh mục' : tab === 'orders' ? 'Đơn hàng' : 'Người dùng'}</h1>
          </div>
          <button className="btn-outline" onClick={load}>Làm mới</button>
        </div>

        {message && <div className={message.type === 'ok' ? 'ok-msg' : 'err-msg'}>{message.text}</div>}

        {loading ? (
          <div className="admin-loading">Đang tải dữ liệu quản trị...</div>
        ) : tab === 'overview' ? (
          <>
            <div className="admin-stat-grid">
              {stats.map(([label, value]) => (
                <div className="admin-stat" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="admin-two-col">
              <div className="admin-panel">
                <div className="admin-panel-head">
                  <h2>Đơn hàng gần đây</h2>
                  <button onClick={() => setTab('orders')}>Xem tất cả</button>
                </div>
                {recentOrders.length === 0 ? <p className="admin-muted">Chưa có đơn hàng.</p> : recentOrders.map(order => (
                  <div className="admin-list-row" key={order.id}>
                    <div>
                      <strong>Đơn #{order.id}</strong>
                      <span>{order.customerName} - {STATUS_LABEL[order.status]}</span>
                    </div>
                    <b>{money(order.totalAmount)}</b>
                  </div>
                ))}
              </div>

              <div className="admin-panel">
                <div className="admin-panel-head">
                  <h2>Cảnh báo tồn kho</h2>
                  <button onClick={() => setTab('products')}>Quản lý kho</button>
                </div>
                {lowStockProducts.length === 0 ? <p className="admin-muted">Tồn kho ổn định.</p> : lowStockProducts.map(product => (
                  <div className="admin-list-row" key={product.id}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{product.category?.name || 'Chưa phân loại'}</span>
                    </div>
                    <b>{product.stock} sp</b>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : tab === 'products' ? (
          <div className="admin-workspace">
            <div className="admin-panel">
              <h2>{productId ? 'Sửa sản phẩm' : 'Tạo sản phẩm'}</h2>
              <div className="form-group">
                <label className="form-label">Chọn sản phẩm</label>
                <select className="form-input" value={productId || ''} onChange={e => setProductId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Tạo sản phẩm mới</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <form className="admin-grid-form" onSubmit={saveProduct}>
                <div className="form-group wide">
                  <label className="form-label">Tên sản phẩm</label>
                  <input className="form-input" name="name" value={productForm.name} onChange={setProductField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá</label>
                  <input className="form-input" name="price" type="number" min="0.01" step="0.01" value={productForm.price} onChange={setProductField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Tồn kho</label>
                  <input className="form-input" name="stock" type="number" min="0" value={productForm.stock} onChange={setProductField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục</label>
                  <select className="form-input" name="categoryId" value={productForm.categoryId} onChange={setProductField} required>
                    <option value="">Chọn danh mục</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ảnh URL</label>
                  <input className="form-input" name="imageUrl" value={productForm.imageUrl} onChange={setProductField} />
                </div>
                <div className="form-group wide">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" name="description" value={productForm.description} onChange={setProductField} rows="4" />
                </div>
                <div className="admin-actions wide">
                  <button type="button" className="btn-sec" onClick={() => setProductId(null)}>Làm mới</button>
                  {productId && <button type="button" className="btn-danger" disabled={saving} onClick={removeProduct}>Xóa</button>}
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : productId ? 'Lưu sản phẩm' : 'Tạo sản phẩm'}</button>
                </div>
              </form>
            </div>

            <div className="admin-panel">
              <h2>Danh sách sản phẩm</h2>
              <div className="admin-table">
                {products.map(product => (
                  <button key={product.id} className="admin-table-row" onClick={() => setProductId(product.id)}>
                    <span>{product.name}</span>
                    <span>{product.category?.name}</span>
                    <span>{money(product.price)}</span>
                    <span className={product.stock <= 5 ? 'danger-text' : ''}>{product.stock} sp</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : tab === 'categories' ? (
          <div className="admin-workspace">
            <div className="admin-panel">
              <h2>{categoryId ? 'Sửa danh mục' : 'Tạo danh mục'}</h2>
              <div className="form-group">
                <label className="form-label">Chọn danh mục</label>
                <select className="form-input" value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Tạo danh mục mới</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <form className="admin-grid-form" onSubmit={saveCategory}>
                <div className="form-group">
                  <label className="form-label">Tên danh mục</label>
                  <input className="form-input" name="name" value={categoryForm.name} onChange={setCategoryField} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Ảnh URL</label>
                  <input className="form-input" name="imageUrl" value={categoryForm.imageUrl} onChange={setCategoryField} />
                </div>
                <div className="admin-actions wide">
                  <button type="button" className="btn-sec" onClick={() => setCategoryId(null)}>Làm mới</button>
                  {categoryId && <button type="button" className="btn-danger" disabled={saving} onClick={removeCategory}>Xóa</button>}
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : categoryId ? 'Lưu danh mục' : 'Tạo danh mục'}</button>
                </div>
              </form>
            </div>

            <div className="admin-panel">
              <h2>Danh sách danh mục</h2>
              <div className="admin-table">
                {categories.map(category => (
                  <button key={category.id} className="admin-table-row" onClick={() => setCategoryId(category.id)}>
                    <span>{category.name}</span>
                    <span>{products.filter(p => p.categoryId === category.id).length} sản phẩm</span>
                    <span>{category.imageUrl ? 'Có ảnh' : 'Chưa có ảnh'}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : tab === 'orders' ? (
          <div className="admin-panel">
            <h2>Quản lý đơn hàng</h2>
            <div className="admin-orders">
              {orders.length === 0 ? <div className="admin-loading">Chưa có đơn hàng.</div> : orders.map(order => (
                <div className="admin-order" key={order.id}>
                  <div className="admin-order-head">
                    <div>
                      <strong>Đơn #{order.id}</strong>
                      <span>{order.customerName} - {order.customerEmail}</span>
                    </div>
                    <select value={order.status} onChange={e => changeStatus(order.id, e.target.value)}>
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-order-meta">{new Date(order.createdAt).toLocaleString('vi-VN')} - {order.shippingAddress}</div>
                  {order.orderItems?.map(item => (
                    <div key={item.id} className="admin-order-item">
                      <span>{item.product?.name || `Sản phẩm #${item.productId}`} x {item.quantity}</span>
                      <span>{money(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="admin-order-total">
                    <span>Tổng</span>
                    <span>{money(order.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="admin-panel">
            <h2>Quản lý người dùng</h2>
            <div className="admin-table">
              {users.map(item => (
                <div key={item.id} className="admin-table-row user-row">
                  <span>
                    <strong>{item.fullName}</strong>
                    <small>{item.email}</small>
                  </span>
                  <span>{item.phone || 'Chưa có SĐT'}</span>
                  <select value={item.role} onChange={e => changeRole(item.id, e.target.value)}>
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                  </select>
                  <button className="btn-danger" disabled={item.id === user.id} onClick={() => removeUser(item.id)}>Xóa</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
