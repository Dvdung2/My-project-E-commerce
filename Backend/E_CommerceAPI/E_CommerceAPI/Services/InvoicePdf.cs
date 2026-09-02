using E_CommerceAPI.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace E_CommerceAPI.Services
{
    public static class InvoicePdf
    {
        public static byte[] Generate(Order order)
        {
            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(40);
                    page.DefaultTextStyle(x => x.FontSize(10));

                    page.Header().Row(row =>
                    {
                        row.RelativeItem().Column(col =>
                        {
                            col.Item().Text("SHOPVN").FontSize(20).Bold();
                            col.Item().Text("Hóa đơn bán hàng").FontSize(12).FontColor(Colors.Grey.Darken1);
                        });
                        row.ConstantItem(160).Column(col =>
                        {
                            col.Item().AlignRight().Text($"Hóa đơn #{order.Id}").Bold();
                            col.Item().AlignRight().Text(order.CreatedAt.ToString("dd/MM/yyyy HH:mm"));
                            col.Item().AlignRight().Text($"Trạng thái: {order.Status}");
                        });
                    });

                    page.Content().PaddingVertical(15).Column(col =>
                    {
                        col.Spacing(10);

                        col.Item().Column(c =>
                        {
                            c.Item().Text("Khách hàng").Bold();
                            c.Item().Text(order.CustomerName);
                            c.Item().Text(order.CustomerEmail);
                            c.Item().Text($"Giao tới: {order.ShippingAddress}");
                        });

                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(4);
                                cols.RelativeColumn(1);
                                cols.RelativeColumn(2);
                                cols.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Element(HeaderCell).Text("Sản phẩm");
                                header.Cell().Element(HeaderCell).AlignRight().Text("SL");
                                header.Cell().Element(HeaderCell).AlignRight().Text("Đơn giá");
                                header.Cell().Element(HeaderCell).AlignRight().Text("Thành tiền");
                            });

                            foreach (var item in order.OrderItems)
                            {
                                table.Cell().Element(BodyCell).Text(item.Product?.Name ?? $"#{item.ProductId}");
                                table.Cell().Element(BodyCell).AlignRight().Text(item.Quantity.ToString());
                                table.Cell().Element(BodyCell).AlignRight().Text($"${item.UnitPrice:0.00}");
                                table.Cell().Element(BodyCell).AlignRight().Text($"${item.UnitPrice * item.Quantity:0.00}");
                            }
                        });

                        var subtotal = order.OrderItems.Sum(i => i.UnitPrice * i.Quantity);
                        col.Item().AlignRight().Column(totals =>
                        {
                            totals.Item().Text($"Tạm tính: ${subtotal:0.00}");
                            if (order.DiscountAmount > 0)
                                totals.Item().Text($"Giảm giá{(order.CouponCode != null ? $" ({order.CouponCode})" : "")}: -${order.DiscountAmount:0.00}");
                            totals.Item().Text($"Phí vận chuyển: ${order.ShippingFee:0.00}");
                            totals.Item().Text($"Tổng cộng: ${order.TotalAmount:0.00}").Bold().FontSize(13);
                        });
                    });

                    page.Footer().AlignCenter().Text("Cảm ơn bạn đã mua hàng tại SHOPVN")
                        .FontColor(Colors.Grey.Medium);
                });
            }).GeneratePdf();
        }

        private static IContainer HeaderCell(IContainer c) =>
            c.Background(Colors.Grey.Lighten3).PaddingVertical(5).PaddingHorizontal(5).DefaultTextStyle(x => x.Bold());

        private static IContainer BodyCell(IContainer c) =>
            c.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5).PaddingHorizontal(5);
    }
}
