using E_CommerceAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace E_CommerceAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<WishlistItem> WishlistItems { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Address> Addresses { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Enforce unique email at the database level (defense in depth on top
            // of the application-level check in AuthController.Register).
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // One review per user per product.
            modelBuilder.Entity<Review>()
                .HasIndex(r => new { r.ProductId, r.UserId })
                .IsUnique();

            modelBuilder.Entity<CartItem>()
                .HasIndex(c => new { c.UserId, c.ProductId })
                .IsUnique();

            modelBuilder.Entity<WishlistItem>()
                .HasIndex(w => new { w.UserId, w.ProductId })
                .IsUnique();

            modelBuilder.Entity<Coupon>()
                .HasIndex(c => c.Code)
                .IsUnique();

            // Seed Categories
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Electronics", ImageUrl = "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400" },
                new Category { Id = 2, Name = "Clothing", ImageUrl = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400" },
                new Category { Id = 3, Name = "Home & Garden", ImageUrl = "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400" },
                new Category { Id = 4, Name = "Sports", ImageUrl = "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400" }
            );

            // Seed Products
            modelBuilder.Entity<Product>().HasData(
                new Product { Id = 1, Name = "iPhone 15 Pro", Description = "Latest Apple smartphone with advanced camera system", Price = 999.99m, ImageUrl = "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400", Stock = 50, CategoryId = 1, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 2, Name = "Samsung Galaxy S24", Description = "Flagship Android smartphone with AI features", Price = 849.99m, ImageUrl = "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400", Stock = 40, CategoryId = 1, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 3, Name = "Sony WH-1000XM5", Description = "Industry-leading noise canceling headphones", Price = 349.99m, ImageUrl = "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400", Stock = 30, CategoryId = 1, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 4, Name = "Nike Air Max 270", Description = "Comfortable running shoes with air cushioning", Price = 129.99m, ImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", Stock = 100, CategoryId = 4, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 5, Name = "Adidas Hoodie", Description = "Classic pullover hoodie for everyday wear", Price = 69.99m, ImageUrl = "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400", Stock = 80, CategoryId = 2, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 6, Name = "MacBook Pro 16\"", Description = "Powerful laptop with M3 Pro chip for professionals", Price = 2499.99m, ImageUrl = "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", Stock = 25, CategoryId = 1, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 7, Name = "Cozy Throw Blanket", Description = "Ultra-soft fleece blanket perfect for home relaxation", Price = 39.99m, ImageUrl = "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=400", Stock = 60, CategoryId = 3, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Product { Id = 8, Name = "Yoga Mat Premium", Description = "Extra-thick non-slip yoga mat with carrying strap", Price = 59.99m, ImageUrl = "https://images.unsplash.com/photo-1601925228008-89e8c8d5e8a5?w=400", Stock = 70, CategoryId = 4, CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
}
