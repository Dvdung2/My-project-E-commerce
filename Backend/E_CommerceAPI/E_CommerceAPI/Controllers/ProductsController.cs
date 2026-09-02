using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Controllers
{
    public class ProductDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0.01, 999999999)]
        public decimal Price { get; set; }

        public string? ImageUrl { get; set; }

        [Range(0, int.MaxValue)]
        public int Stock { get; set; }

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProductsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        // Supports filtering (category, search, price range, in-stock),
        // sorting (newest|price_asc|price_desc|name|best_selling) and paging.
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? categoryId,
            [FromQuery] string? search,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] bool? inStock,
            [FromQuery] string? sort,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12)
        {
            if (page < 1) page = 1;
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.Products.Where(p => !p.IsDeleted).Include(p => p.Category).AsNoTracking().AsQueryable();

            if (categoryId.HasValue)
                query = query.Where(p => p.CategoryId == categoryId);

            var keyword = search?.Trim();
            if (!string.IsNullOrWhiteSpace(keyword))
                query = query.Where(p => p.Name.Contains(keyword) || (p.Description != null && p.Description.Contains(keyword)));

            if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
            if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);
            if (inStock == true) query = query.Where(p => p.Stock > 0);

            query = sort switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "name" => query.OrderBy(p => p.Name),
                "best_selling" => query.OrderByDescending(p => p.OrderItems.Sum(oi => (int?)oi.Quantity) ?? 0),
                _ => query.OrderByDescending(p => p.CreatedAt),
            };

            var totalItems = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.ImageUrl,
                    p.Stock,
                    p.CategoryId,
                    p.Category,
                    p.CreatedAt,
                    averageRating = p.Reviews.Any() ? Math.Round(p.Reviews.Average(r => (double)r.Rating), 1) : 0,
                    reviewCount = p.Reviews.Count
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }

        // GET: api/products/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.Include(p => p.Category).AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound();

            var ratings = await _context.Reviews.Where(r => r.ProductId == id).Select(r => r.Rating).ToListAsync();
            var averageRating = ratings.Count > 0 ? Math.Round(ratings.Average(), 1) : 0;

            var images = await _context.ProductImages
                .Where(pi => pi.ProductId == id)
                .OrderBy(pi => pi.SortOrder)
                .Select(pi => new { pi.Id, pi.Url })
                .ToListAsync();

            return Ok(new
            {
                product.Id,
                product.Name,
                product.Description,
                product.Price,
                product.ImageUrl,
                product.Stock,
                product.CategoryId,
                product.Category,
                product.CreatedAt,
                images,
                averageRating,
                reviewCount = ratings.Count
            });
        }

        // GET: api/products/5/related  -> same category, excluding self
        [HttpGet("{id}/related")]
        public async Task<IActionResult> Related(int id)
        {
            var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound();

            var related = await _context.Products
                .Where(p => p.CategoryId == product.CategoryId && p.Id != id && !p.IsDeleted)
                .Include(p => p.Category)
                .AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .Take(4)
                .ToListAsync();

            return Ok(related);
        }

        // GET: api/products/by-ids?ids=1,2,3  -> for recently-viewed
        [HttpGet("by-ids")]
        public async Task<IActionResult> ByIds([FromQuery] string ids)
        {
            var idList = (ids ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var n) ? n : 0)
                .Where(n => n > 0)
                .Distinct()
                .Take(20)
                .ToList();

            var products = await _context.Products
                .Where(p => idList.Contains(p.Id) && !p.IsDeleted)
                .Include(p => p.Category)
                .AsNoTracking()
                .ToListAsync();

            // Preserve the requested order.
            var ordered = idList
                .Select(i => products.FirstOrDefault(p => p.Id == i))
                .Where(p => p != null)
                .ToList();

            return Ok(ordered);
        }

        // POST: api/products
        [HttpPost]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Create([FromBody] ProductDto dto)
        {
            if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
                return BadRequest("Danh mục không tồn tại.");

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                Price = dto.Price,
                ImageUrl = dto.ImageUrl?.Trim(),
                Stock = dto.Stock,
                CategoryId = dto.CategoryId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
        }

        // PUT: api/products/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Update(int id, [FromBody] ProductDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            if (!await _context.Categories.AnyAsync(c => c.Id == dto.CategoryId))
                return BadRequest("Danh mục không tồn tại.");

            product.Name = dto.Name.Trim();
            product.Description = dto.Description?.Trim();
            product.Price = dto.Price;
            product.ImageUrl = dto.ImageUrl?.Trim();
            product.Stock = dto.Stock;
            product.CategoryId = dto.CategoryId;

            await _context.SaveChangesAsync();
            return Ok(product);
        }

        public class ProductImageDto { public string Url { get; set; } = string.Empty; }

        // POST: api/products/5/images  (admin) -> add a gallery image
        [HttpPost("{id}/images")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> AddImage(int id, [FromBody] ProductImageDto dto)
        {
            if (!await _context.Products.AnyAsync(p => p.Id == id)) return NotFound();
            if (string.IsNullOrWhiteSpace(dto.Url)) return BadRequest("URL ảnh trống.");

            var maxSort = await _context.ProductImages.Where(pi => pi.ProductId == id).MaxAsync(pi => (int?)pi.SortOrder) ?? 0;
            var image = new ProductImage { ProductId = id, Url = dto.Url.Trim(), SortOrder = maxSort + 1 };
            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync();
            return Ok(new { image.Id, image.Url });
        }

        // DELETE: api/products/images/5  (admin)
        [HttpDelete("images/{imageId}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var image = await _context.ProductImages.FindAsync(imageId);
            if (image == null) return NotFound();
            _context.ProductImages.Remove(image);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/products/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            // Soft delete: keeps referential integrity for existing orders while
            // removing the product from the catalog.
            if (await _context.OrderItems.AnyAsync(i => i.ProductId == id))
            {
                product.IsDeleted = true;
            }
            else
            {
                _context.Products.Remove(product);
            }
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
