namespace HelpDesk.Api.Models.Enums;

public static class RoleNames
{
    public const string Employee = "EMPLOYEE";
    public const string Technician = "TECHNICIAN";
    public const string Admin = "ADMIN";

    public static readonly string[] All = [Employee, Technician, Admin];
}