namespace HelpDesk.Api.Models.Dtos;

public record RegisterRequest(string Name, string Email, string Password);

public record LoginRequest(string Email, string Password);

public record AuthResponse(
    string Token,
    string UserId,
    string Name,
    string Email,
    string Role,
    bool IsActive);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record UpdateProfileRequest(string Name);