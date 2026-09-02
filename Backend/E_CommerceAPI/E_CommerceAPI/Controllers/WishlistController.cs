using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class WishlistController : ControllerBase
    {
        private readonly AppDbContext _context;
        public WishlistController(AppDbContext context) => _context = context;

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private async Task<IActionResult> Current()
        {
            var items = await _context.WishlistItems
                .Where(w => w.UserId == UserId)
                .Include(w => w.Product)
                .AsNoTracking()
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new
                {
                    id = w.ProductId,
                    name = w.Product!.Name,
                    price = w.Product.Price,
                    imageUrl = w.Product.ImageUrl,
                    stock = w.Product.Stock,
                    description = w.Product.Description
                })
                .ToListAsync();
            return Ok(items);
        }

        // GET: api/wishlist
        [HttpGet]
        public Task<IActionResult> Get() => Current();

        // POST: api/wishlist/{productId}  -> toggle
        [HttpPost("{productId}")]
        public async Task<IActionResult> Toggle(int productId)
        {
            if (!await _context.Products.AnyAsync(p => p.Id == productId))
                return BadRequest("Sản phẩm không tồn tại.");

            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.UserId == UserId && w.ProductId == productId);
            if (item == null)
                _context.WishlistItems.Add(new WishlistItem { UserId = UserId, ProductId = productId });
            else
                _context.WishlistItems.Remove(item);

            await _context.SaveChangesAsync();
            return await Current();
        }

        // DELETE: api/wishlist/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> Remove(int productId)
        {
            var item = await _context.WishlistItems.FirstOrDefaultAsync(w => w.UserId == UserId && w.ProductId == productId);
            if (item != null)
            {
                _context.WishlistItems.Remove(item);
                await _context.SaveChangesAsync();
            }
            return await Current();
        }
    }
}
