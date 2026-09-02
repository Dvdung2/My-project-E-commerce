using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace E_CommerceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UploadsController : ControllerBase
    {
        private static readonly string[] Allowed = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        private const long MaxBytes = 5 * 1024 * 1024; // 5 MB

        private readonly IWebHostEnvironment _env;
        public UploadsController(IWebHostEnvironment env) => _env = env;

        // POST: api/uploads  (multipart form-data, field "file")
        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Chưa chọn tệp.");
            if (file.Length > MaxBytes) return BadRequest("Tệp vượt quá 5MB.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!Allowed.Contains(ext)) return BadRequest("Định dạng ảnh không hợp lệ.");

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadsDir = Path.Combine(webRoot, "uploads");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(uploadsDir, fileName);
            await using (var stream = System.IO.File.Create(fullPath))
            {
                await file.CopyToAsync(stream);
            }

            var url = $"{Request.Scheme}://{Request.Host}/uploads/{fileName}";
            return Ok(new { url });
        }
    }
}
