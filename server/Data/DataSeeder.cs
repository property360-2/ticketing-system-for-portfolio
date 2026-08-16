using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

        await db.Database.MigrateAsync();

        foreach (var role in RoleNames.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        if (!await db.Departments.AnyAsync())
        {
            db.Departments.AddRange(
                new Department { Name = "IT Support", Description = "Hardware, software and network issues." },
                new Department { Name = "Human Resources", Description = "HR-related requests." },
                new Department { Name = "Finance", Description = "Billing and expense related requests." },
                new Department { Name = "Operations", Description = "Day-to-day operations." });

            await db.SaveChangesAsync();
        }

        if (!await db.Categories.AnyAsync())
        {
            db.Categories.AddRange(
                new Category { Name = "Hardware", Description = "Computers, printers, peripherals." },
                new Category { Name = "Software", Description = "Applications and operating systems." },
                new Category { Name = "Network", Description = "Connectivity and WiFi problems." },
                new Category { Name = "Account", Description = "Login, passwords, permissions." },
                new Category { Name = "Access", Description = "Badges, doors, building access." },
                new Category { Name = "Other", Description = "Anything else." });

            await db.SaveChangesAsync();
        }

        const string adminEmail = "admin@helpdesk.com";

        if (!await userManager.Users.AnyAsync(u => u.Email == adminEmail))
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                Name = "System Admin",
                IsActive = true
            };

            var result = await userManager.CreateAsync(admin, "Admin@123");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, RoleNames.Admin);
            }
        }
    }
}