using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    public class CreateOrderDto
    {
        // CustomerName and CustomerEmail are intentionally NOT accepted from the
        // client. The authenticated user's identity is taken from the JWT so a
        // caller cannot place an order under someone else's name/email.

        [Required, MaxLength(300)]
        public string ShippingAddress { get; set; } = string.Empty;

        [MaxLength(40)]
        public string? CouponCode { get; set; }

        [MinLength(1)]
        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(1, 999)]
        public int Quantity { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        public OrderStatus Status { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public const decimal FreeShippingThreshold = 100m;
        public const decimal FlatShippingFee = 5m;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/orders
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .AsNoTracking()
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(orders);
        }

        // GET: api/orders/5
        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();
            return Ok(order);
        }

        // POST: api/orders
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            var customerEmail = User.FindFirstValue(ClaimTypes.Email);
            var customerName = User.FindFirstValue(ClaimTypes.Name);
            if (string.IsNullOrWhiteSpace(customerEmail) || string.IsNullOrWhiteSpace(customerName))
                return Unauthorized();

            if (dto.Items.Count == 0)
                return BadRequest("Giỏ hàng đang trống.");

            var normalizedItems = dto.Items
                .GroupBy(i => i.ProductId)
                .Select(g => new OrderItemDto { ProductId = g.Key, Quantity = g.Sum(i => i.Quantity) })
                .ToList();

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var order = new Order
            {
                CustomerName = customerName.Trim(),
                CustomerEmail = customerEmail.Trim().ToLowerInvariant(),
                ShippingAddress = dto.ShippingAddress.Trim(),
                CreatedAt = DateTime.UtcNow,
                Status = OrderStatus.Pending
            };

            decimal total = 0;
            foreach (var item in normalizedItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null) return BadRequest($"Product {item.ProductId} not found");
                if (product.Stock < item.Quantity) return BadRequest($"Insufficient stock for {product.Name}");

                product.Stock -= item.Quantity;
                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price
                };
                order.OrderItems.Add(orderItem);
                total += product.Price * item.Quantity;
            }

            // Apply coupon if provided (validated against the subtotal).
            decimal discount = 0;
            if (!string.IsNullOrWhiteSpace(dto.CouponCode))
            {
                var code = dto.CouponCode.Trim().ToUpperInvariant();
                var coupon = await _context.Coupons.FirstOrDefaultAsync(c => c.Code == code);
                var (valid, error) = CouponsController.Evaluate(coupon, total);
                if (valid == null) return BadRequest(error);

                discount = Math.Round(total * valid.DiscountPercent / 100m, 2);
                valid.UsedCount += 1;
                order.CouponCode = valid.Code;
            }

            // Flat shipping fee, free over the threshold (based on discounted subtotal).
            var discountedSubtotal = total - discount;
            var shippingFee = discountedSubtotal >= FreeShippingThreshold ? 0m : FlatShippingFee;

            order.DiscountAmount = discount;
            order.ShippingFee = shippingFee;
            order.TotalAmount = discountedSubtotal + shippingFee;
            order.StatusHistory.Add(new OrderStatusHistory { Status = OrderStatus.Pending, ChangedAt = DateTime.UtcNow });
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var created = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .AsNoTracking()
                .FirstAsync(o => o.Id == order.Id);

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, created);
        }

        // PATCH: api/orders/5/status
        [HttpPatch("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            if (!Enum.IsDefined(typeof(OrderStatus), dto.Status))
                return BadRequest("Trạng thái đơn hàng không hợp lệ.");

            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            if (order.Status != dto.Status)
            {
                order.Status = dto.Status;
                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    Status = dto.Status,
                    ChangedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }
            return Ok(order);
        }

        // POST: api/orders/5/cancel  -> customer cancels own pending order
        [HttpPost("{id}/cancel")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Cancel(int id)
        {
            var email = User.FindFirstValue(ClaimTypes.Email)!.Trim().ToLowerInvariant();

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound();
            if (order.CustomerEmail != email) return Forbid();
            if (order.Status != OrderStatus.Pending)
                return BadRequest("Chỉ có thể hủy đơn hàng đang chờ xử lý.");

            // Restore stock for each line.
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null) product.Stock += item.Quantity;
            }

            order.Status = OrderStatus.Cancelled;
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                Status = OrderStatus.Cancelled,
                ChangedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new { order.Id, order.Status });
        }
    }
}
