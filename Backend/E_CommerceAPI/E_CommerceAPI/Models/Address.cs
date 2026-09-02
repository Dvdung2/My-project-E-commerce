using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Models
{
    public class Address
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User? User { get; set; }

        [Required, MaxLength(100)]
        public string Recipient { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Phone { get; set; } = string.Empty;

        [Required, MaxLength(300)]
        public string Line { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? City { get; set; }

        public bool IsDefault { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
