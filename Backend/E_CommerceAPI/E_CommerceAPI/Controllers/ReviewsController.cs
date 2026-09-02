using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    public class CreateReviewDto
    {
        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }
    }

    [ApiController]
    [Route("api/products/{productId}/reviews")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/products/5/reviews  -> list + summary
        [HttpGet]
        public async Task<IActionResult> Get(int productId)
        {
            if (!await _context.Products.AnyAsync(p => p.Id == productId))
                return NotFound();

            var reviews = await _context.Reviews
                .Where(r => r.ProductId == productId)
                .AsNoTracking()
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new { r.Id, r.UserName, r.Rating, r.Comment, r.CreatedAt })
                .ToListAsync();

            var average = reviews.Count > 0 ? Math.Round(reviews.Average(r => r.Rating), 1) : 0;

            return Ok(new { average, count = reviews.Count, reviews });
        }

        // POST: api/products/5/reviews  -> create or update own review (buyers only)
        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Upsert(int productId, [FromBody] CreateReviewDto dto)
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? "Khách hàng";
            var email = User.FindFirstValue(ClaimTypes.Email)!.Trim().ToLowerInvariant();

            if (!await _context.Products.AnyAsync(p => p.Id == productId))
                return NotFound();

            // Only customers who actually ordered this product may review it.
            var hasPurchased = await _context.OrderItems
                .AnyAsync(oi => oi.ProductId == productId && oi.Order!.CustomerEmail == email);
            if (!hasPurchased)
                return Forbid();

            var review = await _context.Reviews
                .FirstOrDefaultAsync(r => r.ProductId == productId && r.UserId == userId);

            if (review == null)
            {
                review = new Review
                {
                    ProductId = productId,
                    UserId = userId,
                    UserName = userName,
                    Rating = dto.Rating,
                    Comment = dto.Comment?.Trim(),
                    CreatedAt = DateTime.UtcNow
                };
                _context.Reviews.Add(review);
            }
            else
            {
                review.Rating = dto.Rating;
                review.Comment = dto.Comment?.Trim();
                review.CreatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { review.Id, review.UserName, review.Rating, review.Comment, review.CreatedAt });
        }
    }
}
