using HelpDesk.Api.Models.Enums;

namespace HelpDesk.Api.Models.Dtos;

public record CreateTicketRequest(
    string Title,
    string Description,
    TicketPriority Priority,
    int CategoryId,
    int DepartmentId);

public record UpdateTicketRequest(
    string Title,
    string Description,
    TicketPriority Priority,
    int CategoryId,
    int DepartmentId);

public record AssignTicketRequest(string? AssignedToId);

public record UpdateTicketStatusRequest(TicketStatus Status);

public record UpdateTicketPriorityRequest(TicketPriority Priority);

public record TicketResponse(
    int Id,
    string Title,
    string Description,
    TicketStatus Status,
    TicketPriority Priority,
    string CreatedById,
    string CreatedByName,
    string? AssignedToId,
    string? AssignedToName,
    int CategoryId,
    string CategoryName,
    int DepartmentId,
    string DepartmentName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? ResolvedAt,
    DateTime? ClosedAt,
    int CommentCount,
    int AttachmentCount);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);