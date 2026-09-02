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

            order.TotalAmount = total;
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

            order.Status = dto.Status;
            await _context.SaveChangesAsync();
            return Ok(order);
        }
    }
}
