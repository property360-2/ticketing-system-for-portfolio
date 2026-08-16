namespace HelpDesk.Api.Models.Entities;

public class TicketComment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string UserId { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;

    public ApplicationUser User { get; set; } = null!;
}