using Microsoft.AspNetCore.Identity;

namespace HelpDesk.Api.Models.Entities;

public class ApplicationUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }

    public bool IsActive { get; set; } = true;
}
