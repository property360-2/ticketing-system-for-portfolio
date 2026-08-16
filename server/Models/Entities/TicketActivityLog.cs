using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Models.Entities;

public class TicketActivityLog
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public ActivityAction Action { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;
}