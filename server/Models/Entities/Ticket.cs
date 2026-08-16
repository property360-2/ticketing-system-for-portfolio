using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Models.Entities;

public class Ticket
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public TicketStatus Status { get; set; } = TicketStatus.OPEN;

    public TicketPriority Priority { get; set; } = TicketPriority.MEDIUM;

    public string CreatedById { get; set; } = string.Empty;

    public string? AssignedToId { get; set; }

    public int CategoryId { get; set; }

    public int DepartmentId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public ApplicationUser CreatedBy { get; set; } = null!;

    public ApplicationUser? AssignedTo { get; set; }

    public Category Category { get; set; } = null!;

    public Department Department { get; set; } = null!;

    public ICollection<TicketComment> Comments { get; set; } = new List<TicketComment>();

    public ICollection<TicketAttachment> Attachments { get; set; } = new List<TicketAttachment>();

    public ICollection<TicketActivityLog> ActivityLogs { get; set; } = new List<TicketActivityLog>();
}