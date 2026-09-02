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

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
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
            var refreshToken = await IssueRefreshToken(user);
            return Ok(new { token, refreshToken, user = ToUserDto(user) });
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
            var refreshToken = await IssueRefreshToken(user);
            return Ok(new { token, refreshToken, user = ToUserDto(user) });
        }

        public class RefreshDto { public string RefreshToken { get; set; } = string.Empty; }

        // POST: api/auth/refresh  -> rotate refresh token, issue new access token
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshDto dto)
        {
            var stored = await _context.RefreshTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Token == dto.RefreshToken);

            if (stored == null || !stored.IsActive || stored.User == null)
                return Unauthorized("Phiên đăng nhập đã hết hạn.");

            // Rotate: revoke the used token, issue a fresh pair.
            stored.Revoked = true;
            var token = GenerateToken(stored.User);
            var refreshToken = await IssueRefreshToken(stored.User);
            return Ok(new { token, refreshToken, user = ToUserDto(stored.User) });
        }

        // POST: api/auth/logout  -> revoke refresh token
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshDto dto)
        {
            var stored = await _context.RefreshTokens.FirstOrDefaultAsync(t => t.Token == dto.RefreshToken);
            if (stored != null && !stored.Revoked)
            {
                stored.Revoked = true;
                await _context.SaveChangesAsync();
            }
            return Ok(new { message = "Đã đăng xuất." });
        }

        private async Task<string> IssueRefreshToken(User user)
        {
            var token = Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(48));
            _context.RefreshTokens.Add(new RefreshToken
            {
                UserId = user.Id,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return token;
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
                .Include(o => o.StatusHistory)
                .AsNoTracking()
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(orders);
        }

        // POST: api/auth/change-password
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
                return BadRequest("Mật khẩu hiện tại không đúng.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đổi mật khẩu thành công." });
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
