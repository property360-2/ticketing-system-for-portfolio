namespace HelpDesk.Api.Models.Entities;

public class TicketAttachment
{
    public int Id { get; set; }

    public int TicketId { get; set; }

    public string UploadedById { get; set; } = string.Empty;

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public string MimeType { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Ticket Ticket { get; set; } = null!;

    public ApplicationUser UploadedBy { get; set; } = null!;
}