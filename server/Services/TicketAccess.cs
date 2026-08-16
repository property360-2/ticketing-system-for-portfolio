using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Services;

public static class TicketAccess
{
    public static bool CanView(string role, string currentUserId, Ticket ticket)
    {
        if (role == RoleNames.Admin)
        {
            return true;
        }

        if (ticket.CreatedById == currentUserId)
        {
            return true;
        }

        return role == RoleNames.Technician && ticket.AssignedToId == currentUserId;
    }

    public static bool CanModify(string role, string currentUserId, Ticket ticket)
    {
        if (role == RoleNames.Admin)
        {
            return true;
        }

        if (ticket.CreatedById == currentUserId &&
            ticket.Status is TicketStatus.OPEN or TicketStatus.REOPENED)
        {
            return true;
        }

        return role == RoleNames.Technician && ticket.AssignedToId == currentUserId;
    }

    public static IQueryable<Ticket> ApplyScope(IQueryable<Ticket> query, string role, string currentUserId)
    {
        if (role == RoleNames.Admin)
        {
            return query;
        }

        if (role == RoleNames.Technician)
        {
            return query.Where(t => t.AssignedToId == currentUserId || t.CreatedById == currentUserId);
        }

        return query.Where(t => t.CreatedById == currentUserId);
    }
}