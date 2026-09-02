using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    public class CartItemDto
    {
        [Range(1, int.MaxValue)]
        public int ProductId { get; set; }

        [Range(1, 999)]
        public int Quantity { get; set; } = 1;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CartController(AppDbContext context) => _context = context;

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private async Task<IActionResult> CurrentCart()
        {
            var items = await _context.CartItems
                .Where(c => c.UserId == UserId)
                .Include(c => c.Product)
                .AsNoTracking()
                .Select(c => new
                {
                    c.Id,
                    c.ProductId,
                    c.Quantity,
                    name = c.Product!.Name,
                    price = c.Product.Price,
                    imageUrl = c.Product.ImageUrl,
                    stock = c.Product.Stock
                })
                .ToListAsync();
            return Ok(items);
        }

        // GET: api/cart
        [HttpGet]
        public Task<IActionResult> Get() => CurrentCart();

        // POST: api/cart  -> add (increments if present)
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] CartItemDto dto)
        {
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");

            var item = await _context.CartItems.FirstOrDefaultAsync(c => c.UserId == UserId && c.ProductId == dto.ProductId);
            var newQty = (item?.Quantity ?? 0) + dto.Quantity;
            if (newQty > product.Stock) return BadRequest($"Chỉ còn {product.Stock} sản phẩm trong kho.");

            if (item == null)
                _context.CartItems.Add(new CartItem { UserId = UserId, ProductId = dto.ProductId, Quantity = dto.Quantity });
            else
                item.Quantity = newQty;

            await _context.SaveChangesAsync();
            return await CurrentCart();
        }

        // PUT: api/cart/{productId}  -> set absolute quantity
        [HttpPut("{productId}")]
        public async Task<IActionResult> Update(int productId, [FromBody] CartItemDto dto)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return BadRequest("Sản phẩm không tồn tại.");
            if (dto.Quantity > product.Stock) return BadRequest($"Chỉ còn {product.Stock} sản phẩm trong kho.");

            var item = await _context.CartItems.FirstOrDefaultAsync(c => c.UserId == UserId && c.ProductId == productId);
            if (item == null) return NotFound();
            item.Quantity = dto.Quantity;
            await _context.SaveChangesAsync();
            return await CurrentCart();
        }

        // DELETE: api/cart/{productId}
        [HttpDelete("{productId}")]
        public async Task<IActionResult> Remove(int productId)
        {
            var item = await _context.CartItems.FirstOrDefaultAsync(c => c.UserId == UserId && c.ProductId == productId);
            if (item != null)
            {
                _context.CartItems.Remove(item);
                await _context.SaveChangesAsync();
            }
            return await CurrentCart();
        }

        // DELETE: api/cart  -> clear
        [HttpDelete]
        public async Task<IActionResult> Clear()
        {
            var items = _context.CartItems.Where(c => c.UserId == UserId);
            _context.CartItems.RemoveRange(items);
            await _context.SaveChangesAsync();
            return Ok(Array.Empty<object>());
        }
    }
}
