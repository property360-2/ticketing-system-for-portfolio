using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Data;

public static class DataSeeder
{
    private const string DemoUserPassword = "User@123";

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

        var departments = new Dictionary<string, Department>();
        foreach (var d in await db.Departments.ToListAsync())
        {
            departments[d.Name] = d;
        }

        var categories = new Dictionary<string, Category>();
        foreach (var c in await db.Categories.ToListAsync())
        {
            categories[c.Name] = c;
        }

        var admin = await EnsureUserAsync(
            userManager, "System Admin", "admin@helpdesk.com", RoleNames.Admin, null, "Admin@123");

        var technicians = new List<ApplicationUser>
        {
            await EnsureUserAsync(userManager, "Mark Rodriguez", "mark.rodriguez@helpdesk.com", RoleNames.Technician, departments["IT Support"].Id),
            await EnsureUserAsync(userManager, "Sara Chen", "sara.chen@helpdesk.com", RoleNames.Technician, departments["IT Support"].Id),
            await EnsureUserAsync(userManager, "Lee Park", "lee.park@helpdesk.com", RoleNames.Technician, departments["Operations"].Id)
        };

        var employees = new List<ApplicationUser>
        {
            await EnsureUserAsync(userManager, "Emma Wilson", "emma.wilson@helpdesk.com", RoleNames.Employee, departments["Human Resources"].Id),
            await EnsureUserAsync(userManager, "Noah Brown", "noah.brown@helpdesk.com", RoleNames.Employee, departments["IT Support"].Id),
            await EnsureUserAsync(userManager, "Olivia Davis", "olivia.davis@helpdesk.com", RoleNames.Employee, departments["Finance"].Id),
            await EnsureUserAsync(userManager, "William Garcia", "william.garcia@helpdesk.com", RoleNames.Employee, departments["Operations"].Id),
            await EnsureUserAsync(userManager, "Sophia Martinez", "sophia.martinez@helpdesk.com", RoleNames.Employee, departments["Human Resources"].Id),
            await EnsureUserAsync(userManager, "James Miller", "james.miller@helpdesk.com", RoleNames.Employee, departments["Finance"].Id),
            await EnsureUserAsync(userManager, "Ava Anderson", "ava.anderson@helpdesk.com", RoleNames.Employee, departments["IT Support"].Id),
            await EnsureUserAsync(userManager, "Ethan Thomas", "ethan.thomas@helpdesk.com", RoleNames.Employee, departments["Operations"].Id)
        };

        if (!await db.Tickets.AnyAsync())
        {
            await SeedTicketsAsync(db, admin, employees, technicians, departments, categories);
        }
    }

    private static async Task<ApplicationUser> EnsureUserAsync(
        UserManager<ApplicationUser> userManager,
        string name,
        string email,
        string role,
        int? departmentId,
        string? password = null)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return existing;
        }

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            Name = name,
            DepartmentId = departmentId,
            IsActive = true
        };

        var result = await userManager.CreateAsync(user, password ?? DemoUserPassword);
        if (!result.Succeeded)
        {
            throw new InvalidOperationException(
                $"Failed to seed user {email}: {string.Join("; ", result.Errors.Select(e => e.Description))}");
        }

        await userManager.AddToRoleAsync(user, role);
        return user;
    }

    private sealed record CommentSeed(bool IsTech, int UserIndex, string Text, int DaysAfter);

    private sealed record TicketSeed(
        string Title,
        string Description,
        string Category,
        string Department,
        TicketPriority Priority,
        TicketStatus Status,
        int CreatedByIndex,
        int? AssignedToIndex,
        int CreatedDaysAgo,
        CommentSeed[] Comments);

    private static async Task SeedTicketsAsync(
        ApplicationDbContext db,
        ApplicationUser admin,
        List<ApplicationUser> employees,
        List<ApplicationUser> technicians,
        Dictionary<string, Department> departments,
        Dictionary<string, Category> categories)
    {
        var specs = new[]
        {
            new TicketSeed(
                "Laptop won't boot - black screen at startup",
                "My laptop turns on but the screen stays black. The power light is on and I hear the fan. I've tried holding the power button for 30 seconds.",
                "Hardware", "IT Support", TicketPriority.HIGH, TicketStatus.OPEN,
                6, null, 1, []),

            new TicketSeed(
                "VPN connection keeps dropping every few minutes",
                "Since yesterday the corporate VPN disconnects every 2-3 minutes while working from home. Reconnecting works but it's very disruptive.",
                "Network", "IT Support", TicketPriority.HIGH, TicketStatus.IN_PROGRESS,
                1, 0, 3,
                [
                    new CommentSeed(true, 0, "I've restarted the VPN gateway service and checked the logs. Please test connectivity again and let me know if it drops.", 3),
                    new CommentSeed(false, 1, "It seems stable now, thank you Mark.", 2)
                ]),

            new TicketSeed(
                "Cannot access shared drive //finance-reports",
                "I am getting \"access denied\" when trying to open the finance-reports shared drive. I had access last week.",
                "Access", "Operations", TicketPriority.MEDIUM, TicketStatus.IN_PROGRESS,
                3, 2, 2,
                [
                    new CommentSeed(true, 2, "Permissions are being reset on the NAS. I'll update you within the hour.", 1)
                ]),

            new TicketSeed(
                "Payroll report export fails with server error",
                "The monthly payroll export job fails every time with a generic server error after about 5 minutes. No error details shown to the user.",
                "Software", "Finance", TicketPriority.CRITICAL, TicketStatus.OPEN,
                5, null, 0, []),

            new TicketSeed(
                "Printer in office 2B keeps jamming",
                "The shared printer on the second floor jams every few pages. Paper gets stuck inside the roller area.",
                "Hardware", "Operations", TicketPriority.LOW, TicketStatus.RESOLVED,
                7, 2, 8,
                [
                    new CommentSeed(true, 2, "Replaced the rollers and cleaned the tray. Should be fine now.", 6)
                ]),

            new TicketSeed(
                "New hire onboarding - access to HR portal",
                "Please provision HR portal access for the new account manager starting on Monday. Hiring manager confirmed.",
                "Account", "Human Resources", TicketPriority.MEDIUM, TicketStatus.CLOSED,
                4, 0, 15,
                [
                    new CommentSeed(true, 0, "Access provisioned and verified.", 14),
                    new CommentSeed(false, 4, "Works now. Thanks!", 13)
                ]),

            new TicketSeed(
                "Email signature missing on team mailbox",
                "The signature is not applied on emails sent from the shared team mailbox, even though it is enabled in settings.",
                "Account", "Human Resources", TicketPriority.LOW, TicketStatus.CLOSED,
                0, 1, 20,
                [
                    new CommentSeed(true, 1, "Fixed the signature template and re-tested.", 19),
                    new CommentSeed(false, 0, "Confirmed, thank you.", 18)
                ]),

            new TicketSeed(
                "WiFi slow on the 3rd floor",
                "Internet speed on the 3rd floor drops drastically in the afternoon. Speed tests show under 1 Mbps.",
                "Network", "IT Support", TicketPriority.MEDIUM, TicketStatus.IN_PROGRESS,
                6, 1, 2,
                [
                    new CommentSeed(true, 1, "We identified a band saturation issue and scheduled an access point firmware update.", 1)
                ]),

            new TicketSeed(
                "Travel expense reimbursement stuck in approval",
                "My reimbursement from the Lisbon trip is stuck in the approval queue for two weeks. Submission says pending finance review.",
                "Other", "Finance", TicketPriority.MEDIUM, TicketStatus.OPEN,
                2, null, 4, []),

            new TicketSeed(
                "Teams meeting audio not working",
                "During meetings other participants cannot hear me. The microphone works in other apps. It broke again after the last update.",
                "Software", "Human Resources", TicketPriority.HIGH, TicketStatus.REOPENED,
                4, 0, 10,
                [
                    new CommentSeed(true, 0, "Reinstalled the audio driver, please test in a call.", 8),
                    new CommentSeed(false, 4, "Audio broke again after the update.", 9)
                ]),

            new TicketSeed(
                "Badge access for parking garage",
                "My access badge does not open the parking garage barrier anymore. It works for the building doors.",
                "Access", "Operations", TicketPriority.LOW, TicketStatus.RESOLVED,
                3, 2, 6,
                [
                    new CommentSeed(true, 2, "Badge reprogrammed for garage access.", 5)
                ]),

            new TicketSeed(
                "Server room temperature spike in rack B",
                "Temperature sensor in rack B is showing 31°C and climbing. HVAC seems to be running but not cooling that zone.",
                "Hardware", "Operations", TicketPriority.CRITICAL, TicketStatus.OPEN,
                7, null, 0, [])
        };

        var now = DateTime.UtcNow;

        foreach (var spec in specs)
        {
            var department = departments[spec.Department];
            var category = categories[spec.Category];
            var creator = employees[spec.CreatedByIndex];
            var assignee = spec.AssignedToIndex is int idx ? technicians[idx] : null;

            var createdAt = now.AddDays(-spec.CreatedDaysAgo);
            var at = createdAt;

            var ticket = new Ticket
            {
                Title = spec.Title,
                Description = spec.Description,
                Status = spec.Status,
                Priority = spec.Priority,
                CreatedById = creator.Id,
                AssignedToId = assignee?.Id,
                CategoryId = category.Id,
                DepartmentId = department.Id,
                CreatedAt = createdAt,
                UpdatedAt = createdAt
            };

            db.Tickets.Add(ticket);
            await db.SaveChangesAsync();

            var activity = new List<TicketActivityLog>
            {
                new()
                {
                    TicketId = ticket.Id,
                    UserId = creator.Id,
                    Action = ActivityAction.TICKET_CREATED,
                    CreatedAt = at
                }
            };

            if (assignee is not null)
            {
                at = at.AddHours(1);
                activity.Add(new TicketActivityLog
                {
                    TicketId = ticket.Id,
                    UserId = admin.Id,
                    Action = ActivityAction.TICKET_ASSIGNED,
                    NewValue = assignee.Name,
                    CreatedAt = at
                });
            }

            void Transition(TicketActivityLog entry)
            {
                at = at.AddHours(3);
                entry.TicketId = ticket.Id;
                entry.CreatedAt = at;
                activity.Add(entry);
            }

            switch (spec.Status)
            {
                case TicketStatus.OPEN:
                    break;

                case TicketStatus.IN_PROGRESS:
                    Transition(new TicketActivityLog
                    {
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.STATUS_CHANGED,
                        OldValue = TicketStatus.OPEN.ToString(),
                        NewValue = TicketStatus.IN_PROGRESS.ToString()
                    });
                    break;

                case TicketStatus.RESOLVED:
                case TicketStatus.CLOSED:
                    ticket.ResolvedAt = at.AddHours(18);
                    Transition(new TicketActivityLog
                    {
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.STATUS_CHANGED,
                        OldValue = TicketStatus.OPEN.ToString(),
                        NewValue = TicketStatus.IN_PROGRESS.ToString()
                    });
                    Transition(new TicketActivityLog
                    {
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.STATUS_CHANGED,
                        OldValue = TicketStatus.IN_PROGRESS.ToString(),
                        NewValue = TicketStatus.RESOLVED.ToString()
                    });
                    at = ticket.ResolvedAt.Value;
                    activity.Add(new TicketActivityLog
                    {
                        TicketId = ticket.Id,
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.TICKET_RESOLVED,
                        CreatedAt = at
                    });

                    if (spec.Status == TicketStatus.CLOSED)
                    {
                        ticket.ClosedAt = at.AddDays(1);
                        at = ticket.ClosedAt.Value;
                        activity.Add(new TicketActivityLog
                        {
                            TicketId = ticket.Id,
                            UserId = creator.Id,
                            Action = ActivityAction.TICKET_CLOSED,
                            CreatedAt = at
                        });
                    }
                    break;

                case TicketStatus.REOPENED:
                    ticket.ResolvedAt = at.AddHours(9);
                    Transition(new TicketActivityLog
                    {
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.STATUS_CHANGED,
                        OldValue = TicketStatus.OPEN.ToString(),
                        NewValue = TicketStatus.IN_PROGRESS.ToString()
                    });
                    Transition(new TicketActivityLog
                    {
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.STATUS_CHANGED,
                        OldValue = TicketStatus.IN_PROGRESS.ToString(),
                        NewValue = TicketStatus.RESOLVED.ToString()
                    });
                    at = ticket.ResolvedAt.Value;
                    activity.Add(new TicketActivityLog
                    {
                        TicketId = ticket.Id,
                        UserId = assignee?.Id ?? creator.Id,
                        Action = ActivityAction.TICKET_RESOLVED,
                        CreatedAt = at
                    });
                    ticket.ClosedAt = at.AddDays(1);
                    at = ticket.ClosedAt.Value;
                    activity.Add(new TicketActivityLog
                    {
                        TicketId = ticket.Id,
                        UserId = creator.Id,
                        Action = ActivityAction.TICKET_CLOSED,
                        CreatedAt = at
                    });
                    ticket.ResolvedAt = null;
                    ticket.ClosedAt = null;
                    at = at.AddDays(1);
                    activity.Add(new TicketActivityLog
                    {
                        TicketId = ticket.Id,
                        UserId = creator.Id,
                        Action = ActivityAction.TICKET_REOPENED,
                        CreatedAt = at
                    });
                    break;
            }

            foreach (var commentSeed in spec.Comments)
            {
                var author = commentSeed.IsTech ? technicians[commentSeed.UserIndex] : employees[commentSeed.UserIndex];
                var commentTime = createdAt.AddDays(commentSeed.DaysAfter);

                db.TicketComments.Add(new TicketComment
                {
                    TicketId = ticket.Id,
                    UserId = author.Id,
                    Content = commentSeed.Text,
                    CreatedAt = commentTime,
                    UpdatedAt = commentTime
                });

                activity.Add(new TicketActivityLog
                {
                    TicketId = ticket.Id,
                    UserId = author.Id,
                    Action = ActivityAction.COMMENT_ADDED,
                    CreatedAt = commentTime
                });
            }

            db.TicketActivityLogs.AddRange(activity);

            var lastActivity = activity.Max(a => a.CreatedAt);
            ticket.UpdatedAt = lastActivity > ticket.UpdatedAt ? lastActivity : ticket.UpdatedAt;

            await db.SaveChangesAsync();
        }
    }
}