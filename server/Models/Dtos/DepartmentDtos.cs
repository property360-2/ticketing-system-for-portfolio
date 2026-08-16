namespace HelpDesk.Api.Models.Dtos;

public record DepartmentRequest(string Name, string? Description);

public record DepartmentResponse(
    int Id,
    string Name,
    string? Description,
    int UserCount,
    DateTime CreatedAt,
    DateTime UpdatedAt);