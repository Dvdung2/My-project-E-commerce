using System.ComponentModel.DataAnnotations;

namespace E_CommerceAPI.Models
{
    public class ProductImage
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required, MaxLength(500)]
        public string Url { get; set; } = string.Empty;

        public int SortOrder { get; set; } = 0;
    }
}
