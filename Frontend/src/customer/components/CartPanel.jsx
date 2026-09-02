export default function CartPanel({ cart, totalAmount, onClose, onUpdateQty, onRemove, onCheckout }) {
  return (
    <>
      <div className="cart-backdrop" onClick={onClose} />
      <aside className="cart-panel">
        <div className="cart-head">
          <h2>Giỏ hàng — {cart.length} sản phẩm</h2>
          <button id="close-cart" className="btn-close" onClick={onClose}>✕</button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">○</div>
            <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text2)' }}>Giỏ hàng trống</p>
            <p style={{ fontSize: '.75rem' }}>Hãy thêm sản phẩm</p>
          </div>
        ) : (
          <div className="cart-items">
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <img className="ci-img"
                  src={item.imageUrl || 'https://via.placeholder.com/52'}
                  alt={item.name}
                  onError={e => { e.target.src = 'https://via.placeholder.com/52' }}
                />
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-price">${(item.price * item.qty).toFixed(2)}</div>
                </div>
                <div className="ci-ctrl">
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, -1)}>−</button>
                  <span className="qty-val">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item.id, 1)}>+</button>
                  <button className="btn-del" onClick={() => onRemove(item.id)}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cart-foot">
          <div className="cart-total">
            <span>Tổng cộng</span>
            <span className="cart-total-val">${totalAmount.toFixed(2)}</span>
          </div>
          <button
            id="checkout-button"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={cart.length === 0}
            onClick={onCheckout}
          >
            Thanh toán
          </button>
        </div>
      </aside>
    </>
  )
}
