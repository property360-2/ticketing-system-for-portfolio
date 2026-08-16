namespace HelpDesk.Api.Models.Dtos;

public record AttachmentResponse(
    int Id,
    string FileName,
    long FileSize,
    string MimeType,
    string UploadedById,
    string UploadedByName,
    DateTime CreatedAt);