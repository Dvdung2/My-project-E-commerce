using E_CommerceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    public class UpdateUserRoleDto
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private static readonly string[] Roles = ["Admin", "Staff", "Customer"];
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _context.Users
                .AsNoTracking()
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.Phone,
                    u.Address,
                    u.Role,
                    u.CreatedAt
                })
                .ToListAsync();

            return Ok(users);
        }

        // PATCH: api/users/5/role
        [HttpPatch("{id}/role")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateUserRoleDto dto)
        {
            var role = dto.Role.Trim();
            if (!Roles.Contains(role))
                return BadRequest("Vai trò không hợp lệ.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (user.Role == "Admin" && role != "Admin")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
                if (adminCount <= 1)
                    return Conflict("Không thể hạ quyền admin cuối cùng.");
            }

            user.Role = role;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Phone,
                user.Address,
                user.Role,
                user.CreatedAt
            });
        }

        // DELETE: api/users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var currentUserId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (id == currentUserId)
                return Conflict("Không thể xóa chính tài khoản đang đăng nhập.");

            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (user.Role == "Admin")
            {
                var adminCount = await _context.Users.CountAsync(u => u.Role == "Admin");
                if (adminCount <= 1)
                    return Conflict("Không thể xóa admin cuối cùng.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
