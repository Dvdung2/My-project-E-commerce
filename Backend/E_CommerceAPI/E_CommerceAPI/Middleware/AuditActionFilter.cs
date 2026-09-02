using E_CommerceAPI.Data;
using E_CommerceAPI.Models;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace E_CommerceAPI.Middleware
{
    /// <summary>
    /// Records an audit entry for every mutating request (POST/PUT/PATCH/DELETE)
    /// performed by an authenticated Admin or Staff user.
    /// </summary>
    public class AuditActionFilter : IAsyncActionFilter
    {
        private static readonly HashSet<string> Mutating = new(StringComparer.OrdinalIgnoreCase)
        { "POST", "PUT", "PATCH", "DELETE" };

        private readonly AppDbContext _context;
        public AuditActionFilter(AppDbContext context) => _context = context;

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var executed = await next();

            var http = context.HttpContext;
            var role = http.User.FindFirstValue(ClaimTypes.Role);
            var method = http.Request.Method;

            if (Mutating.Contains(method) && (role == "Admin" || role == "Staff"))
            {
                try
                {
                    _context.AuditLogs.Add(new AuditLog
                    {
                        UserId = int.TryParse(http.User.FindFirstValue(ClaimTypes.NameIdentifier), out var uid) ? uid : null,
                        UserEmail = http.User.FindFirstValue(ClaimTypes.Email),
                        Role = role,
                        Method = method,
                        Path = http.Request.Path.Value ?? "",
                        StatusCode = http.Response.StatusCode,
                        Timestamp = DateTime.UtcNow
                    });
                    await _context.SaveChangesAsync();
                }
                catch { /* auditing must never break the request */ }
            }
        }
    }
}
