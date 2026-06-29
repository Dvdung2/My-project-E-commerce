import { useEffect, useMemo, useState } from 'react'
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getOrders,
  getProducts,
  updateCategory,
  updateOrderStatus,
  updateProduct
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

export default function AdminModal({ onClose, onChanged }) {
  const [tab, setTab] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
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

  const load = async () => {
    setLoading(true)
    setMessage(null)
    try {
      const [p, c, o] = await Promise.all([getProducts(), getCategories(), getOrders()])
      setProducts(p.data)
      setCategories(c.data)
      setOrders(o.data)
    } catch (err) {
      setMessage({ type: 'err', text: apiError(err) })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal admin-modal">
        <div className="modal-head">
          <h2 className="modal-title">Quản trị cửa hàng</h2>
          <button className="btn-close" onClick={onClose}>x</button>
        </div>

        <div className="admin-tabs">
          {[
            ['products', 'Sản phẩm'],
            ['categories', 'Danh mục'],
            ['orders', 'Đơn hàng']
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        <div className="modal-body admin-body">
          {message && (
            <div className={message.type === 'ok' ? 'ok-msg' : 'err-msg'}>{message.text}</div>
          )}

          {loading ? (
            <div className="admin-loading">Đang tải...</div>
          ) : tab === 'products' ? (
            <>
              <div className="form-group">
                <label className="form-label">Chọn sản phẩm</label>
                <select className="form-input" value={productId || ''} onChange={e => setProductId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Tạo sản phẩm mới</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
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
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Ảnh URL</label>
                  <input className="form-input" name="imageUrl" value={productForm.imageUrl} onChange={setProductField} />
                </div>
                <div className="form-group wide">
                  <label className="form-label">Mô tả</label>
                  <textarea className="form-input" name="description" value={productForm.description} onChange={setProductField} rows="3" />
                </div>
                <div className="admin-actions wide">
                  <button type="button" className="btn-sec" onClick={() => setProductId(null)}>Làm mới</button>
                  {productId && <button type="button" className="btn-danger" disabled={saving} onClick={removeProduct}>Xóa</button>}
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : productId ? 'Lưu sản phẩm' : 'Tạo sản phẩm'}</button>
                </div>
              </form>
            </>
          ) : tab === 'categories' ? (
            <>
              <div className="form-group">
                <label className="form-label">Chọn danh mục</label>
                <select className="form-input" value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Tạo danh mục mới</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
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
            </>
          ) : (
            <div className="admin-orders">
              {orders.length === 0 ? (
                <div className="admin-loading">Chưa có đơn hàng.</div>
              ) : orders.map(order => (
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
                      <span>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="admin-order-total">
                    <span>Tổng</span>
                    <span>${order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
