namespace HelpDesk.Api.Models.Dtos;

public record CategoryRequest(string Name, string? Description);

public record CategoryResponse(
    int Id,
    string Name,
    string? Description,
    DateTime CreatedAt,
    DateTime UpdatedAt);