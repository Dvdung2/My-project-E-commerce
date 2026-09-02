import { useNavigate } from 'react-router-dom'

export default function WishlistPanel({ items, onClose, onRemove, onAddToCart }) {
  const navigate = useNavigate()

  const openProduct = (id) => {
    onClose()
    navigate(`/product/${id}`)
  }

  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <aside className="cart-panel">
        <div className="cart-head">
          <h2>Wishlist - {items.length} sản phẩm</h2>
          <button id="close-wishlist" className="btn-close" onClick={onClose}>×</button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">♡</div>
            <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text2)' }}>Wishlist đang trống</p>
            <p style={{ fontSize: '.75rem' }}>Lưu sản phẩm bạn muốn xem lại</p>
          </div>
        ) : (
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="wishlist-item">
                <button className="wishlist-thumb" onClick={() => openProduct(item.id)}>
                  <img
                    src={item.imageUrl || 'https://via.placeholder.com/52'}
                    alt={item.name}
                    onError={e => { e.target.src = 'https://via.placeholder.com/52' }}
                  />
                </button>
                <button className="wishlist-info" onClick={() => openProduct(item.id)}>
                  <span className="ci-name">{item.name}</span>
                  <span className="ci-price">${item.price.toFixed(2)}</span>
                  <span className={`card-stock ${item.stock <= 5 ? 'low' : ''}`}>
                    {item.stock <= 0 ? 'Hết hàng' : `${item.stock} sp`}
                  </span>
                </button>
                <div className="wishlist-actions">
                  <button
                    className="btn-mini"
                    disabled={item.stock <= 0}
                    onClick={() => onAddToCart(item)}
                  >
                    Thêm
                  </button>
                  <button className="btn-del" onClick={() => onRemove(item.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  )
}
