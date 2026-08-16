using HelpDesk.Api.Data;
using HelpDesk.Api.Extensions;
using HelpDesk.Api.Models.Dtos;
using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;
using HelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var query = ScopedQuery();

        var summary = new DashboardSummary(
            await query.CountAsync(),
            await query.CountAsync(t => t.Status == TicketStatus.OPEN),
            await query.CountAsync(t => t.Status == TicketStatus.IN_PROGRESS),
            await query.CountAsync(t => t.Status == TicketStatus.RESOLVED),
            await query.CountAsync(t => t.Status == TicketStatus.CLOSED),
            await query.CountAsync(t => t.Priority == TicketPriority.CRITICAL));

        return Ok(summary);
    }

    [HttpGet("tickets-by-status")]
    public async Task<IActionResult> TicketsByStatus()
    {
        var query = ScopedQuery();

        var counts = await query
            .GroupBy(t => t.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var all = Enum.GetValues<TicketStatus>()
            .ToDictionary(s => s, s => 0);

        foreach (var c in counts)
        {
            all[c.Status] = c.Count;
        }

        return Ok(all.Select(kv => new CountByValue(kv.Key.ToString(), kv.Value)));
    }

    [HttpGet("tickets-by-priority")]
    public async Task<IActionResult> TicketsByPriority()
    {
        var query = ScopedQuery();

        var counts = await query
            .GroupBy(t => t.Priority)
            .Select(g => new { Priority = g.Key, Count = g.Count() })
            .ToListAsync();

        var all = Enum.GetValues<TicketPriority>()
            .ToDictionary(p => p, p => 0);

        foreach (var c in counts)
        {
            all[c.Priority] = c.Count;
        }

        return Ok(all.Select(kv => new CountByValue(kv.Key.ToString(), kv.Value)));
    }

    [HttpGet("tickets-by-category")]
    public async Task<IActionResult> TicketsByCategory()
    {
        var query = ScopedQuery();

        var items = await query
            .GroupBy(t => new { t.CategoryId, t.Category.Name })
            .Select(g => new CountByValue(g.Key.Name, g.Count()))
            .ToListAsync();

        return Ok(items);
    }

    [HttpGet("tickets-by-department")]
    public async Task<IActionResult> TicketsByDepartment()
    {
        var query = ScopedQuery();

        var items = await query
            .GroupBy(t => new { t.DepartmentId, t.Department.Name })
            .Select(g => new CountByValue(g.Key.Name, g.Count()))
            .ToListAsync();

        return Ok(items);
    }

    private IQueryable<Ticket> ScopedQuery()
    {
        var query = _db.Tickets.AsNoTracking();
        var role = User.GetUserRole() ?? RoleNames.Employee;
        var userId = User.GetUserId();
        return TicketAccess.ApplyScope(query, role, userId);
    }
}