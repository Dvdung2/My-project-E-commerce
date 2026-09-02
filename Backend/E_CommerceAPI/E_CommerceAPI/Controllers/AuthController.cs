using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace E_CommerceAPI.Controllers
{
    public class RegisterDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(300)]
        public string Address { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileDto
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [MaxLength(300)]
        public string Address { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Email == email))
                return BadRequest("Email đã được sử dụng.");

            // Public registration always creates a Customer. Admin accounts are
            // provisioned only through the seeded SeedAdmin configuration at
            // startup, never granted based on who registers first.
            var user = new User
            {
                FullName = dto.FullName.Trim(),
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Phone = dto.Phone.Trim(),
                Address = dto.Address.Trim(),
                Role = "Customer",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = GenerateToken(user);
            return Ok(new { token, user = ToUserDto(user) });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return Unauthorized("Email hoặc mật khẩu không đúng.");

            var token = GenerateToken(user);
            return Ok(new { token, user = ToUserDto(user) });
        }

        // GET: api/auth/me
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(ToUserDto(user));
        }

        // PUT: api/auth/profile
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.FullName = dto.FullName.Trim();
            user.Phone = dto.Phone.Trim();
            user.Address = dto.Address.Trim();
            await _context.SaveChangesAsync();
            return Ok(ToUserDto(user));
        }

        // GET: api/auth/my-orders
        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            var email = User.FindFirstValue(ClaimTypes.Email)!.Trim().ToLowerInvariant();
            var orders = await _context.Orders
                .Where(o => o.CustomerEmail == email)
                .Include(o => o.OrderItems).ThenInclude(i => i.Product)
                .AsNoTracking()
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(orders);
        }

        private string GenerateToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var expireHours = int.Parse(_config["Jwt:ExpireHours"] ?? "24");

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(expireHours),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static object ToUserDto(User u) => new
        {
            u.Id, u.FullName, u.Email, u.Phone, u.Address, u.Role, u.CreatedAt
        };
    }
}
