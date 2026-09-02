import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getCategories } from '@/shared/services/api'

function Skeleton() {
  return (
    <div className="skel-grid">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="skel-card">
          <div className="skel-img" />
          <div className="skel-line" />
          <div className="skel-line s" />
        </div>
      ))}
    </div>
  )
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
  { value: 'best_selling', label: 'Bán chạy' },
]

export default function ProductsPage({ search, addToCart, catalogVersion, wishlistIds, toggleWishlist }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Reset to first page whenever a filter/sort/search changes.
  useEffect(() => { setPage(1) }, [cat, search, sort, minPrice, maxPrice, inStock])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, c] = await Promise.all([
        getProducts({
          categoryId: cat,
          search: search || undefined,
          sort,
          minPrice: minPrice || undefined,
          maxPrice: maxPrice || undefined,
          inStock: inStock || undefined,
          page,
          pageSize: 12,
        }),
        getCategories()
      ])
      setProducts(p.data.items)
      setTotalPages(p.data.totalPages)
      setTotalItems(p.data.totalItems)
      setCategories(c.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [cat, search, sort, minPrice, maxPrice, inStock, page, catalogVersion])

  useEffect(() => {
    const t = setTimeout(load, 280)
    return () => clearTimeout(t)
  }, [load])

  return (
    <main className="products-page">
      <div className="container section" id="products">
        <div className="section-header products-header">
          <div>
            <div className="section-label">Danh mục</div>
            <div className="section-title">Sản phẩm</div>
            <div className="section-sub">{loading ? '...' : `${totalItems} sản phẩm`}</div>
          </div>
          <button className="btn-outline" onClick={() => navigate('/')}>Về trang chủ</button>
        </div>

        <div className="cat-wrap">
          <button id="cat-all" className={`cat-chip ${cat === null ? 'active' : ''}`} onClick={() => setCat(null)}>
            Tất cả
          </button>
          {categories.map(c => (
            <button key={c.id} id={`cat-${c.id}`}
              className={`cat-chip ${cat === c.id ? 'active' : ''}`}
              onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>

        <div className="filter-bar">
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sắp xếp">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input className="filter-price" type="number" min="0" placeholder="Giá từ" value={minPrice}
            onChange={e => setMinPrice(e.target.value)} aria-label="Giá tối thiểu" />
          <input className="filter-price" type="number" min="0" placeholder="Giá đến" value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)} aria-label="Giá tối đa" />
          <label className="filter-check">
            <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
            Còn hàng
          </label>
        </div>

        <div className="divider" style={{ marginBottom: '0' }} />

        {loading ? <Skeleton /> : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">○</div>
            <p style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text2)' }}>Không tìm thấy sản phẩm</p>
            <p style={{ fontSize: '.78rem', marginTop: '.3rem' }}>Thử từ khóa khác</p>
          </div>
        ) : (
          <div className="grid-wrap" style={{ marginTop: '0' }}>
            <div className="grid">
              {products.map((p, idx) => (
                <div key={p.id} id={`product-${p.id}`} className="card" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="card-img-wrap">
                    <img className="card-img"
                      src={p.imageUrl || 'https://via.placeholder.com/400'}
                      alt={p.name} loading="lazy"
                      onError={e => { e.target.src = 'https://via.placeholder.com/400?text=No+Image' }}
                    />
                    {idx < 3 && <span className="badge-new">Mới</span>}
                    {p.stock <= 5 && p.stock > 0 && <span className="badge-low">Sắp hết</span>}
                    <button
                      className={`card-wish ${wishlistIds.includes(p.id) ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                      aria-label={wishlistIds.includes(p.id) ? 'Bỏ khỏi wishlist' : 'Thêm vào wishlist'}
                    >
                      {wishlistIds.includes(p.id) ? '♥' : '♡'}
                    </button>
                    <div className="card-overlay" style={{ flexDirection: 'column', gap: '.5rem' }}>
                      <button className="card-quick" disabled={p.stock <= 0} onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                        {p.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                      <button className="card-quick" disabled={p.stock <= 0} style={{ background: 'var(--bg)', color: 'var(--white)', border: '1px solid var(--line2)' }}
                        onClick={(e) => { e.stopPropagation(); addToCart(p, true); }}>
                        Mua ngay
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-cat">{p.category?.name}</div>
                    <div className="card-name">{p.name}</div>
                    <div className="card-desc">{p.description}</div>
                    <div className="card-footer">
                      <div className="card-price">${p.price.toFixed(2)}</div>
                      <div className={`card-stock ${p.stock <= 5 ? 'low' : ''}`}>
                        {p.stock <= 5 ? `Còn ${p.stock}` : `${p.stock} sp`}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                  ← Trước
                </button>
                <span className="page-info">Trang {page}/{totalPages}</span>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                  Sau →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
