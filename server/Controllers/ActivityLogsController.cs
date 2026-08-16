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
[Route("api/v1")]
[Authorize]
public class ActivityLogsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ActivityLogsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("tickets/{ticketId:int}/activity")]
    public async Task<IActionResult> GetForTicket(int ticketId)
    {
        var ticket = await _db.Tickets.AsNoTracking().FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var role = User.GetUserRole() ?? RoleNames.Employee;
        var userId = User.GetUserId();

        if (!TicketAccess.CanView(role, userId, ticket))
        {
            return Forbid();
        }

        var logs = await _db.TicketActivityLogs
            .AsNoTracking()
            .Where(l => l.TicketId == ticketId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new ActivityLogResponse(
                l.Id, l.Action, l.OldValue, l.NewValue, l.UserId, l.User.Name, l.CreatedAt))
            .ToListAsync();

        return Ok(logs);
    }

    [HttpGet("activity-logs")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? userId,
        [FromQuery] ActivityAction? action,
        [FromQuery] int? ticketId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.TicketActivityLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(userId))
        {
            query = query.Where(l => l.UserId == userId);
        }

        if (action is not null)
        {
            query = query.Where(l => l.Action == action);
        }

        if (ticketId is not null)
        {
            query = query.Where(l => l.TicketId == ticketId);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new ActivityLogResponse(
                l.Id, l.Action, l.OldValue, l.NewValue, l.UserId, l.User.Name, l.CreatedAt))
            .ToListAsync();

        return Ok(new PagedResult<ActivityLogResponse>(items, total, page, pageSize));
    }
}