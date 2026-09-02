using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_CommerceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AnalyticsController(AppDbContext context) => _context = context;

        // GET: api/analytics/summary
        [HttpGet("summary")]
        public async Task<IActionResult> Summary()
        {
            // Revenue counts only non-cancelled orders.
            var paidOrders = _context.Orders.Where(o => o.Status != OrderStatus.Cancelled);

            var totalRevenue = await paidOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
            var totalOrders = await _context.Orders.CountAsync();
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");
            var totalProducts = await _context.Products.CountAsync(p => !p.IsDeleted);

            // Revenue for the last 14 days.
            var since = DateTime.UtcNow.Date.AddDays(-13);
            var dailyRaw = await paidOrders
                .Where(o => o.CreatedAt >= since)
                .GroupBy(o => o.CreatedAt.Date)
                .Select(g => new { Date = g.Key, Revenue = g.Sum(o => o.TotalAmount), Orders = g.Count() })
                .ToListAsync();

            var revenueByDay = Enumerable.Range(0, 14)
                .Select(i => since.AddDays(i))
                .Select(d =>
                {
                    var row = dailyRaw.FirstOrDefault(x => x.Date == d);
                    return new { date = d.ToString("yyyy-MM-dd"), revenue = row?.Revenue ?? 0, orders = row?.Orders ?? 0 };
                })
                .ToList();

            // Top 5 products by quantity sold (excluding cancelled orders).
            var topProducts = await _context.OrderItems
                .Where(oi => oi.Order!.Status != OrderStatus.Cancelled)
                .GroupBy(oi => new { oi.ProductId, oi.Product!.Name })
                .Select(g => new
                {
                    productId = g.Key.ProductId,
                    name = g.Key.Name,
                    quantitySold = g.Sum(x => x.Quantity),
                    revenue = g.Sum(x => x.UnitPrice * x.Quantity)
                })
                .OrderByDescending(x => x.quantitySold)
                .Take(5)
                .ToListAsync();

            var ordersByStatus = await _context.Orders
                .GroupBy(o => o.Status)
                .Select(g => new { status = g.Key, count = g.Count() })
                .ToListAsync();

            var lowStock = await _context.Products
                .Where(p => p.Stock <= 5 && !p.IsDeleted)
                .OrderBy(p => p.Stock)
                .Select(p => new { p.Id, p.Name, p.Stock })
                .ToListAsync();

            return Ok(new
            {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts,
                revenueByDay,
                topProducts,
                ordersByStatus,
                lowStock
            });
        }
    }
}
