using Microsoft.AspNetCore.Identity;

namespace HelpDesk.Api.Models.Entities;

public class ApplicationUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Department? Department { get; set; }

    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();

    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();

    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();

    public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();

    public ICollection<TicketActivityLog> ActivityLogs { get; set; } = new List<TicketActivityLog>();
}