using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace E_CommerceAPI.Data
{
    /// <summary>
    /// Used only by EF Core design-time tooling (e.g. `dotnet ef migrations add`).
    /// This bypasses Program.cs so migrations can be scaffolded without a runtime
    /// connection string. The connection string here is not used to connect for
    /// `migrations add`; a real one is supplied at runtime via configuration.
    /// </summary>
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
    {
        public AppDbContext CreateDbContext(string[] args)
        {
            var connectionString =
                Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? "Server=localhost;Database=EcommerceDb;Trusted_Connection=False;TrustServerCertificate=True;";

            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseSqlServer(connectionString)
                .Options;

            return new AppDbContext(options);
        }
    }
}
