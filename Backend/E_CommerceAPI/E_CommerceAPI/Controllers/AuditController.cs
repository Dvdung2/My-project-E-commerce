using E_CommerceAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace E_CommerceAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AuditController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AuditController(AppDbContext context) => _context = context;

        // GET: api/audit?take=100
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int take = 100)
        {
            take = Math.Clamp(take, 1, 500);
            var logs = await _context.AuditLogs
                .AsNoTracking()
                .OrderByDescending(a => a.Timestamp)
                .Take(take)
                .ToListAsync();
            return Ok(logs);
        }
    }
}
