using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Models
{
    public class AuditLog
    {
        public int Id { get; set; }

        public int? UserId { get; set; }

        [MaxLength(200)]
        public string? UserEmail { get; set; }

        [MaxLength(20)]
        public string? Role { get; set; }

        [Required, MaxLength(10)]
        public string Method { get; set; } = string.Empty;

        [Required, MaxLength(300)]
        public string Path { get; set; } = string.Empty;

        public int StatusCode { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
