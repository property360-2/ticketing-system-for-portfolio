namespace HelpDesk.Api.Models.Dtos;

public record UserResponse(
    string Id,
    string Name,
    string Email,
    string Role,
    int? DepartmentId,
    string? DepartmentName,
    bool IsActive,
    DateTime CreatedAt);

public record CreateUserRequest(string Name, string Email, string Password, string Role, int? DepartmentId);

public record UpdateUserRequest(string Name, int? DepartmentId);

public record UpdateUserStatusRequest(bool IsActive);

public record UpdateUserRoleRequest(string Role);

public record UpdateUserDepartmentRequest(int? DepartmentId);