using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace E_CommerceAPI.Hubs
{
    /// <summary>
    /// Realtime order notifications. Admin/Staff join the "staff" group to hear
    /// about new orders; each customer joins a group keyed by their email to be
    /// notified when their own order status changes.
    /// </summary>
    [Authorize]
    public class OrderHub : Hub
    {
        public const string StaffGroup = "staff";

        public static string CustomerGroup(string email) => $"customer:{email.Trim().ToLowerInvariant()}";

        public override async Task OnConnectedAsync()
        {
            var role = Context.User?.FindFirstValue(ClaimTypes.Role);
            var email = Context.User?.FindFirstValue(ClaimTypes.Email);

            if (role is "Admin" or "Staff")
                await Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);
            else if (!string.IsNullOrWhiteSpace(email))
                await Groups.AddToGroupAsync(Context.ConnectionId, CustomerGroup(email));

            await base.OnConnectedAsync();
        }
    }
}
