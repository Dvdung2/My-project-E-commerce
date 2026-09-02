import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProducts, getCategories } from '@/shared/services/api'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'name', label: 'Tên A → Z' },
  { value: 'best_selling', label: 'Bán chạy' },
]

const PRICE_RANGES = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới $50', min: '', max: '50' },
  { label: '$50 – $200', min: '50', max: '200' },
  { label: '$200 – $500', min: '200', max: '500' },
  { label: '$500 – $1.000', min: '500', max: '1000' },
  { label: 'Trên $1.000', min: '1000', max: '' },
]

function Stars({ value }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`star ${n <= Math.round(value) ? 'on' : ''}`}>★</span>
      ))}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="pgrid">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="skel-card" style={{ borderRadius: 'var(--r)' }}>
          <div className="skel-img" style={{ borderRadius: 'var(--r)' }} />
          <div className="skel-line" />
          <div className="skel-line s" />
        </div>
      ))}
    </div>
  )
}

export default function ProductsPage({ search, addToCart, catalogVersion, wishlistIds, toggleWishlist }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [cat, setCat] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [priceIdx, setPriceIdx] = useState(0)
  const [inStock, setInStock] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  useEffect(() => { setPage(1) }, [cat, search, sort, priceIdx, inStock])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const range = PRICE_RANGES[priceIdx]
      const [p, c] = await Promise.all([
        getProducts({
          categoryId: cat,
          search: search || undefined,
          sort,
          minPrice: range.min || undefined,
          maxPrice: range.max || undefined,
          inStock: inStock || undefined,
          page,
          pageSize: 9,
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
  }, [cat, search, sort, priceIdx, inStock, page, catalogVersion])

  useEffect(() => {
    const t = setTimeout(load, 280)
    return () => clearTimeout(t)
  }, [load])

  return (
    <main className="products-page">
      <div className="container section" id="products">
        <div className="shop-layout">
          {/* Sidebar filters */}
          <aside className="shop-sidebar">
            <div className="shop-fgroup">
              <h3 className="shop-ftitle">Danh mục</h3>
              <div className="shop-checks">
                {categories.map(c => (
                  <label key={c.id} className="shop-check">
                    <input
                      type="checkbox"
                      checked={cat === c.id}
                      onChange={() => setCat(cat === c.id ? null : c.id)}
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="shop-fgroup">
              <h3 className="shop-ftitle">Khoảng giá</h3>
              <div className="price-list">
                {PRICE_RANGES.map((r, i) => (
                  <button
                    key={r.label}
                    className={`price-pill ${priceIdx === i ? 'active' : ''}`}
                    onClick={() => setPriceIdx(i)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="shop-fgroup">
              <label className="shop-check">
                <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} />
                <span>Chỉ hiện còn hàng</span>
              </label>
            </div>
          </aside>

          {/* Product grid */}
          <div className="shop-main">
            <div className="shop-head">
              <div>
                <div className="section-label">Danh mục</div>
                <h1 className="section-title">Sản phẩm</h1>
                <div className="section-sub">{loading ? '...' : `${totalItems} sản phẩm`}</div>
              </div>
              <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sắp xếp">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {loading ? <Skeleton /> : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">○</div>
                <p style={{ fontWeight: 600, fontSize: '.9rem', color: 'var(--text2)' }}>Không tìm thấy sản phẩm</p>
                <p style={{ fontSize: '.78rem', marginTop: '.3rem' }}>Thử bộ lọc hoặc từ khóa khác</p>
              </div>
            ) : (
              <>
                <div className="pgrid">
                  {products.map((p, idx) => (
                    <article key={p.id} id={`product-${p.id}`} className="pcard" onClick={() => navigate(`/product/${p.id}`)}>
                      <div className="pcard-media">
                        <img className="pcard-img"
                          src={p.imageUrl || 'https://via.placeholder.com/400'}
                          alt={p.name} loading="lazy"
                          onError={e => { e.target.src = 'https://via.placeholder.com/400?text=No+Image' }}
                        />
                        {idx < 3 && page === 1 && sort === 'newest' && <span className="badge-new">Mới</span>}
                        {p.stock <= 5 && p.stock > 0 && <span className="badge-low">Sắp hết</span>}
                        <button
                          className={`card-wish ${wishlistIds.includes(p.id) ? 'active' : ''}`}
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(p); }}
                          aria-label={wishlistIds.includes(p.id) ? 'Bỏ khỏi wishlist' : 'Thêm vào wishlist'}
                        >
                          {wishlistIds.includes(p.id) ? '♥' : '♡'}
                        </button>
                        <div className="pcard-overlay">
                          <button className="card-quick" disabled={p.stock <= 0} onClick={(e) => { e.stopPropagation(); addToCart(p); }}>
                            {p.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                          </button>
                        </div>
                      </div>
                      <div className="pcard-body">
                        <div className="pcard-cat">{p.category?.name}</div>
                        <h3 className="pcard-name">{p.name}</h3>
                        {p.reviewCount > 0 && (
                          <div className="pcard-rate">
                            <Stars value={p.averageRating} />
                            <span>({p.reviewCount})</span>
                          </div>
                        )}
                        <div className="pcard-price">${p.price.toFixed(2)}</div>
                      </div>
                    </article>
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
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
