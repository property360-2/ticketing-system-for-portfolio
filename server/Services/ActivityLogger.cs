using HelpDesk.Api.Data;
using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Services;

public static class ActivityLogger
{
    public static void Add(
        ApplicationDbContext db,
        Ticket ticket,
        string userId,
        ActivityAction action,
        string? oldValue = null,
        string? newValue = null)
    {
        db.TicketActivityLogs.Add(new TicketActivityLog
        {
            TicketId = ticket.Id,
            UserId = userId,
            Action = action,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow
        });
    }
}