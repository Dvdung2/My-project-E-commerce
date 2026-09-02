using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Controllers
{
    public class CouponDto
    {
        [Required, MaxLength(40)]
        public string Code { get; set; } = string.Empty;

        [Range(1, 100)]
        public int DiscountPercent { get; set; }

        [Range(0, 999999999)]
        public decimal MinOrderAmount { get; set; }

        public DateTime? ExpiresAt { get; set; }

        public int? MaxUses { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CouponsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CouponsController(AppDbContext context) => _context = context;

        /// <summary>Validates a coupon against a subtotal. Returns (coupon, error).</summary>
        public static (Coupon?, string?) Evaluate(Coupon? coupon, decimal subtotal)
        {
            if (coupon == null || !coupon.IsActive) return (null, "Mã giảm giá không hợp lệ.");
            if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < DateTime.UtcNow) return (null, "Mã giảm giá đã hết hạn.");
            if (coupon.MaxUses.HasValue && coupon.UsedCount >= coupon.MaxUses.Value) return (null, "Mã giảm giá đã hết lượt sử dụng.");
            if (subtotal < coupon.MinOrderAmount) return (null, $"Đơn tối thiểu {coupon.MinOrderAmount:0.##} để dùng mã này.");
            return (coupon, null);
        }

        // GET: api/coupons/validate?code=SAVE10&subtotal=100
        [HttpGet("validate")]
        public async Task<IActionResult> Validate([FromQuery] string code, [FromQuery] decimal subtotal)
        {
            var normalized = (code ?? "").Trim().ToUpperInvariant();
            var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == normalized);
            var (valid, error) = Evaluate(coupon, subtotal);
            if (valid == null) return BadRequest(error);

            var discount = Math.Round(subtotal * valid.DiscountPercent / 100m, 2);
            return Ok(new { code = valid.Code, discountPercent = valid.DiscountPercent, discountAmount = discount });
        }

        // GET: api/coupons  (admin)
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var coupons = await _context.Coupons.AsNoTracking().OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(coupons);
        }

        // POST: api/coupons  (admin)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CouponDto dto)
        {
            var code = dto.Code.Trim().ToUpperInvariant();
            if (await _context.Coupons.AnyAsync(c => c.Code == code))
                return Conflict("Mã giảm giá đã tồn tại.");

            var coupon = new Coupon
            {
                Code = code,
                DiscountPercent = dto.DiscountPercent,
                MinOrderAmount = dto.MinOrderAmount,
                ExpiresAt = dto.ExpiresAt,
                MaxUses = dto.MaxUses,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Coupons.Add(coupon);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetAll), new { id = coupon.Id }, coupon);
        }

        // DELETE: api/coupons/5  (admin)  -> deactivate
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return NotFound();
            coupon.IsActive = false;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
