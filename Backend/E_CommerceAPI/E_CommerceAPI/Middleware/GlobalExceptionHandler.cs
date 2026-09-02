using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace E_CommerceAPI.Middleware
{
    /// <summary>
    /// Catches unhandled exceptions and returns a consistent ProblemDetails
    /// response instead of leaking a stack trace, while logging the full error.
    /// </summary>
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
        {
            _logger.LogError(exception,
                "Unhandled exception for {Method} {Path}",
                httpContext.Request.Method, httpContext.Request.Path);

            var problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "An unexpected error occurred.",
                Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
                Instance = httpContext.Request.Path
            };

            httpContext.Response.StatusCode = problem.Status.Value;
            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }
    }
}
