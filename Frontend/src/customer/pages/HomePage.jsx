import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="hero-eyebrow">Cửa hàng trực tuyến</div>
            <h1>Mua sắm đơn giản.<br />Chất lượng tốt nhất.</h1>
            <p>Khám phá sản phẩm chính hãng, đặt hàng nhanh, theo dõi đơn dễ dàng và lưu lại món yêu thích trong wishlist.</p>
            <div className="hero-actions">
              <Link to="/products" className="btn-primary home-link">Khám phá sản phẩm</Link>
              <Link to="/products" className="btn-outline home-link">Xem ưu đãi</Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-val">10K+</div>
                <div className="stat-label">Sản phẩm</div>
              </div>
              <div className="stat">
                <div className="stat-val">50K+</div>
                <div className="stat-label">Khách hàng</div>
              </div>
              <div className="stat">
                <div className="stat-val">99%</div>
                <div className="stat-label">Hài lòng</div>
              </div>
              <div className="stat">
                <div className="stat-val">24/7</div>
                <div className="stat-label">Hỗ trợ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-header home-section-head">
          <div>
            <div className="section-label">Mua sắm</div>
            <div className="section-title">Lối vào nhanh</div>
            <div className="section-sub">Chọn một điểm bắt đầu phù hợp với bạn</div>
          </div>
          <Link to="/products" className="btn-outline home-link">Tất cả sản phẩm</Link>
        </div>

        <div className="home-feature-grid">
          <Link to="/products" className="home-feature">
            <span className="home-feature-kicker">Catalog</span>
            <strong>Sản phẩm mới</strong>
            <span>Xem toàn bộ sản phẩm đang có trong cửa hàng.</span>
          </Link>
          <Link to="/products" className="home-feature">
            <span className="home-feature-kicker">Wishlist</span>
            <strong>Lưu món yêu thích</strong>
            <span>Đánh dấu sản phẩm để quay lại mua sau.</span>
          </Link>
          <Link to="/products" className="home-feature">
            <span className="home-feature-kicker">Checkout</span>
            <strong>Đặt hàng nhanh</strong>
            <span>Thêm vào giỏ và hoàn tất đơn hàng trong vài bước.</span>
          </Link>
        </div>
      </section>
    </main>
  )
}
