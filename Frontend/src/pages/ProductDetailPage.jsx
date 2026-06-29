import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductById } from '../services/api'

export default function ProductDetailPage({ addToCart, wishlistIds, toggleWishlist }) {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  useEffect(() => {
    setLoading(true)
    getProductById(id)
      .then(res => setProduct(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="container section">
      <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
        <div className="skel-img" style={{ width: 'min(500px, 100%)', height: '500px', borderRadius: 'var(--r)' }} />
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="skel-line" style={{ width: '30%', margin: '0 0 1rem' }} />
          <div className="skel-line" style={{ height: '30px', margin: '0 0 1.5rem' }} />
          <div className="skel-line" style={{ height: '100px', margin: '0 0 2rem' }} />
          <div className="skel-line" style={{ width: '40%' }} />
        </div>
      </div>
    </div>
  )

  if (!product) return (
    <div className="container section empty-state">
      <div className="empty-state-icon">○</div>
      <p style={{ fontWeight: 600 }}>Không tìm thấy sản phẩm</p>
      <Link to="/" className="btn-outline" style={{ marginTop: '1rem', textDecoration: 'none' }}>Quay lại trang chủ</Link>
    </div>
  )

  const wishlisted = wishlistIds.includes(product.id)

  return (
    <div className="container section">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" className="btn-ghost" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          ← Quay lại
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '4rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left: Image */}
        <div style={{ flex: '1 1 500px', maxWidth: '100%' }}>
          <div className="grid-wrap" style={{ borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <img 
              src={product.imageUrl || 'https://via.placeholder.com/600'} 
              alt={product.name}
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* Right: Info */}
        <div style={{ flex: '1 1 400px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div className="section-label">{product.category?.name}</div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1rem' }}>
                {product.name}
              </h1>
            </div>
            <button
              className={`detail-wish ${wishlisted ? 'active' : ''}`}
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? 'Bo khoi wishlist' : 'Them vao wishlist'}
            >
              {wishlisted ? '♥' : '♡'}
            </button>
          </div>
          
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.5rem' }}>
            ${product.price.toFixed(2)}
          </div>

          <div className="divider" style={{ margin: '1.5rem 0' }} />

          <p style={{ color: 'var(--text2)', lineHeight: 1.8, fontSize: '.95rem', marginBottom: '2rem' }}>
            {product.description || 'Chưa có mô tả cho sản phẩm này.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="ci-ctrl" style={{ padding: '.5rem', background: 'var(--bg2)', borderRadius: 'var(--r2)', border: '1px solid var(--line)' }}>
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-val" style={{ padding: '0 1rem' }}>{qty}</span>
              <button className="qty-btn" disabled={qty >= product.stock} onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
            </div>
            
            <div className={`card-stock ${product.stock <= 5 ? 'low' : ''}`} style={{ fontSize: '.85rem' }}>
              {product.stock <= 0 ? 'Hết hàng' : `Trong kho: ${product.stock} sản phẩm`}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn-outline" 
              style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}
              disabled={product.stock <= 0}
              onClick={() => {
                for(let i=0; i<qty; i++) addToCart(product)
              }}
            >
              Thêm vào giỏ
            </button>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: '1rem', fontSize: '1rem' }}
              disabled={product.stock <= 0}
              onClick={() => {
                for(let i=0; i<qty; i++) addToCart(product, true)
              }}
            >
              Mua ngay
            </button>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'var(--bg1)', padding: '1rem', borderRadius: 'var(--r2)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '.5rem' }}>Giao hàng</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>2 - 4 ngày làm việc</div>
            </div>
            <div style={{ background: 'var(--bg1)', padding: '1rem', borderRadius: 'var(--r2)', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '.7rem', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '.5rem' }}>Bảo hành</div>
              <div style={{ fontSize: '.85rem', color: 'var(--text2)' }}>12 tháng chính hãng</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
