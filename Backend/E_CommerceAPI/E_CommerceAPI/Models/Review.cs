using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Models
{
    public class Review
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required, MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Range(1, 5)]
        public int Rating { get; set; }

        [MaxLength(1000)]
        public string? Comment { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
