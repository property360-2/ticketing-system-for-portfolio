using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Models.Dtos;

public record ActivityLogResponse(
    int Id,
    ActivityAction Action,
    string? OldValue,
    string? NewValue,
    string UserId,
    string UserName,
    DateTime CreatedAt);