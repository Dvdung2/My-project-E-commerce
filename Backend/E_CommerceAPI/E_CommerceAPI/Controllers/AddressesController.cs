using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace E_CommerceAPI.Controllers
{
    public class AddressDto
    {
        [Required, MaxLength(100)]
        public string Recipient { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required, MaxLength(300)]
        public string Line { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? City { get; set; }

        public bool IsDefault { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")]
    public class AddressesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AddressesController(AppDbContext context) => _context = context;

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var list = await _context.Addresses
                .Where(a => a.UserId == UserId)
                .AsNoTracking()
                .OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt)
                .ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AddressDto dto)
        {
            var address = new Address
            {
                UserId = UserId,
                Recipient = dto.Recipient.Trim(),
                Phone = dto.Phone.Trim(),
                Line = dto.Line.Trim(),
                City = dto.City?.Trim(),
                IsDefault = dto.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            // First address is default; a new default clears the others.
            if (!await _context.Addresses.AnyAsync(a => a.UserId == UserId)) address.IsDefault = true;
            if (address.IsDefault) await ClearDefaults();

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();
            return Ok(address);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AddressDto dto)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
            if (address == null) return NotFound();

            address.Recipient = dto.Recipient.Trim();
            address.Phone = dto.Phone.Trim();
            address.Line = dto.Line.Trim();
            address.City = dto.City?.Trim();
            if (dto.IsDefault && !address.IsDefault) { await ClearDefaults(); address.IsDefault = true; }

            await _context.SaveChangesAsync();
            return Ok(address);
        }

        [HttpPatch("{id}/default")]
        public async Task<IActionResult> SetDefault(int id)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
            if (address == null) return NotFound();
            await ClearDefaults();
            address.IsDefault = true;
            await _context.SaveChangesAsync();
            return Ok(address);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == UserId);
            if (address == null) return NotFound();
            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task ClearDefaults()
        {
            var defaults = await _context.Addresses.Where(a => a.UserId == UserId && a.IsDefault).ToListAsync();
            foreach (var a in defaults) a.IsDefault = false;
        }
    }
}
