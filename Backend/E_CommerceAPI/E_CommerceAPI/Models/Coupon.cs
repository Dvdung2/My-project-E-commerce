using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_CommerceAPI.Models
{
    public class Coupon
    {
        public int Id { get; set; }

        [Required, MaxLength(40)]
        public string Code { get; set; } = string.Empty;

        [Range(1, 100)]
        public int DiscountPercent { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal MinOrderAmount { get; set; } = 0;

        public DateTime? ExpiresAt { get; set; }

        public int? MaxUses { get; set; }

        public int UsedCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
