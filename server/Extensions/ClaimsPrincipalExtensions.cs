using System.Security.Claims;

namespace HelpDesk.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static string GetUserId(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? principal.FindFirstValue("sub")
            ?? string.Empty;
    }

    public static string? GetUserRole(this ClaimsPrincipal principal)
    {
        return principal.FindFirstValue(ClaimTypes.Role);
    }
}