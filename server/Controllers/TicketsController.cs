using HelpDesk.Api.Data;
using HelpDesk.Api.Extensions;
using HelpDesk.Api.Models.Dtos;
using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;
using HelpDesk.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/tickets")]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AttachmentStorage _storage;

    public TicketsController(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        AttachmentStorage storage)
    {
        _db = db;
        _userManager = userManager;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] TicketStatus? status,
        [FromQuery] TicketPriority? priority,
        [FromQuery] int? categoryId,
        [FromQuery] int? departmentId,
        [FromQuery] string? assignedToId,
        [FromQuery] string? createdById,
        [FromQuery] string? search,
        [FromQuery] string? sortBy,
        [FromQuery] string? sortOrder,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (userId, role) = CurrentUser();

        var query = _db.Tickets.AsNoTracking();
        query = TicketAccess.ApplyScope(query, role, userId);

        if (status is not null)
        {
            query = query.Where(t => t.Status == status);
        }

        if (priority is not null)
        {
            query = query.Where(t => t.Priority == priority);
        }

        if (categoryId is not null)
        {
            query = query.Where(t => t.CategoryId == categoryId);
        }

        if (departmentId is not null)
        {
            query = query.Where(t => t.DepartmentId == departmentId);
        }

        if (!string.IsNullOrWhiteSpace(assignedToId))
        {
            query = query.Where(t => t.AssignedToId == assignedToId);
        }

        if (!string.IsNullOrWhiteSpace(createdById))
        {
            query = query.Where(t => t.CreatedById == createdById);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = $"%{search}%";
            query = query.Where(t =>
                EF.Functions.Like(t.Title, term) ||
                EF.Functions.Like(t.Description, term));
        }

        var total = await query.CountAsync();

        query = ApplySorting(query, sortBy, sortOrder);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ToResponse())
            .ToListAsync();

        return Ok(new PagedResult<TicketResponse>(items, total, page, pageSize));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTicketRequest request)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId))
        {
            return BadRequest(new { message = "Category does not exist." });
        }

        if (!await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
        {
            return BadRequest(new { message = "Department does not exist." });
        }

        var userId = User.GetUserId();

        var ticket = new Ticket
        {
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            Status = TicketStatus.OPEN,
            CategoryId = request.CategoryId,
            DepartmentId = request.DepartmentId,
            CreatedById = userId
        };

        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        ActivityLogger.Add(_db, ticket, userId, ActivityAction.TICKET_CREATED);
        await _db.SaveChangesAsync();

        return StatusCode(201, await ToResponseAsync(ticket.Id));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ticket = await _db.Tickets.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var (userId, role) = CurrentUser();
        if (!TicketAccess.CanView(role, userId, ticket))
        {
            return Forbid();
        }

        return Ok(await ToResponseAsync(id));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTicketRequest request)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var (userId, role) = CurrentUser();
        if (!TicketAccess.CanModify(role, userId, ticket))
        {
            return Forbid();
        }

        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId))
        {
            return BadRequest(new { message = "Category does not exist." });
        }

        if (!await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
        {
            return BadRequest(new { message = "Department does not exist." });
        }

        var oldPriority = ticket.Priority;

        ticket.Title = request.Title;
        ticket.Description = request.Description;
        ticket.Priority = request.Priority;
        ticket.CategoryId = request.CategoryId;
        ticket.DepartmentId = request.DepartmentId;
        ticket.UpdatedAt = DateTime.UtcNow;

        if (oldPriority != request.Priority)
        {
            ActivityLogger.Add(_db, ticket, userId, ActivityAction.PRIORITY_CHANGED,
                oldPriority.ToString(), request.Priority.ToString());
        }

        await _db.SaveChangesAsync();

        return Ok(await ToResponseAsync(id));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var ticket = await _db.Tickets
            .Include(t => t.Attachments)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        foreach (var attachment in ticket.Attachments)
        {
            _storage.Delete(attachment.FilePath);
        }

        _db.Tickets.Remove(ticket);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    [HttpPatch("{id:int}/assignment")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Assign(int id, [FromBody] AssignTicketRequest request)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        string? newAssigneeName = null;
        if (request.AssignedToId is not null)
        {
            var assignee = await _userManager.FindByIdAsync(request.AssignedToId);
            if (assignee is null)
            {
                return BadRequest(new { message = "Assigned user does not exist." });
            }

            newAssigneeName = assignee.Name;
        }

        var oldAssigneeName = ticket.AssignedToId is null
            ? null
            : (await _userManager.FindByIdAsync(ticket.AssignedToId))?.Name;

        ticket.AssignedToId = request.AssignedToId;
        ticket.UpdatedAt = DateTime.UtcNow;

        ActivityLogger.Add(_db, ticket, User.GetUserId(), ActivityAction.TICKET_ASSIGNED,
            oldAssigneeName, newAssigneeName);

        await _db.SaveChangesAsync();

        return Ok(await ToResponseAsync(id));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTicketStatusRequest request)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var (userId, role) = CurrentUser();

        var allowed = role == RoleNames.Admin
            || (role == RoleNames.Technician && ticket.AssignedToId == userId)
            || (ticket.CreatedById == userId &&
                request.Status is TicketStatus.CLOSED or TicketStatus.REOPENED);

        if (!allowed)
        {
            return Forbid();
        }

        var oldStatus = ticket.Status;
        if (oldStatus == request.Status)
        {
            return Ok(await ToResponseAsync(id));
        }

        ticket.Status = request.Status;
        ticket.UpdatedAt = DateTime.UtcNow;

        switch (request.Status)
        {
            case TicketStatus.RESOLVED:
                ticket.ResolvedAt ??= DateTime.UtcNow;
                ticket.ClosedAt = null;
                ActivityLogger.Add(_db, ticket, userId, ActivityAction.TICKET_RESOLVED, oldStatus.ToString(), null);
                break;

            case TicketStatus.CLOSED:
                ticket.ResolvedAt ??= DateTime.UtcNow;
                ticket.ClosedAt = DateTime.UtcNow;
                ActivityLogger.Add(_db, ticket, userId, ActivityAction.TICKET_CLOSED, oldStatus.ToString(), null);
                break;

            case TicketStatus.REOPENED:
                ticket.ResolvedAt = null;
                ticket.ClosedAt = null;
                ActivityLogger.Add(_db, ticket, userId, ActivityAction.TICKET_REOPENED, oldStatus.ToString(), null);
                break;
        }

        ActivityLogger.Add(_db, ticket, userId, ActivityAction.STATUS_CHANGED,
            oldStatus.ToString(), request.Status.ToString());

        await _db.SaveChangesAsync();

        return Ok(await ToResponseAsync(id));
    }

    [HttpPatch("{id:int}/priority")]
    public async Task<IActionResult> UpdatePriority(int id, [FromBody] UpdateTicketPriorityRequest request)
    {
        var ticket = await _db.Tickets.FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var (userId, role) = CurrentUser();
        if (!TicketAccess.CanModify(role, userId, ticket))
        {
            return Forbid();
        }

        var oldPriority = ticket.Priority;
        ticket.Priority = request.Priority;
        ticket.UpdatedAt = DateTime.UtcNow;

        ActivityLogger.Add(_db, ticket, userId, ActivityAction.PRIORITY_CHANGED,
            oldPriority.ToString(), request.Priority.ToString());

        await _db.SaveChangesAsync();

        return Ok(await ToResponseAsync(id));
    }

    private (string UserId, string Role) CurrentUser()
    {
        return (User.GetUserId(), User.GetUserRole() ?? RoleNames.Employee);
    }

    private static IQueryable<Ticket> ApplySorting(IQueryable<Ticket> query, string? sortBy, string? sortOrder)
    {
        var descending = string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

        return (sortBy?.ToLowerInvariant()) switch
        {
            "title" => descending ? query.OrderByDescending(t => t.Title) : query.OrderBy(t => t.Title),
            "status" => descending ? query.OrderByDescending(t => t.Status) : query.OrderBy(t => t.Status),
            "priority" => descending ? query.OrderByDescending(t => t.Priority) : query.OrderBy(t => t.Priority),
            "updatedat" => descending ? query.OrderByDescending(t => t.UpdatedAt) : query.OrderBy(t => t.UpdatedAt),
            "id" => descending ? query.OrderByDescending(t => t.Id) : query.OrderBy(t => t.Id),
            _ => query.OrderByDescending(t => t.CreatedAt)
        };
    }

    private static Expression<Func<Ticket, TicketResponse>> ToResponse()
    {
        return t => new TicketResponse(
            t.Id,
            t.Title,
            t.Description,
            t.Status,
            t.Priority,
            t.CreatedById,
            t.CreatedBy.Name,
            t.AssignedToId,
            t.AssignedTo == null ? null : t.AssignedTo.Name,
            t.CategoryId,
            t.Category.Name,
            t.DepartmentId,
            t.Department.Name,
            t.CreatedAt,
            t.UpdatedAt,
            t.ResolvedAt,
            t.ClosedAt,
            t.Comments.Count,
            t.Attachments.Count);
    }

    private async Task<TicketResponse> ToResponseAsync(int id)
    {
        return await _db.Tickets
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(ToResponse())
            .FirstAsync();
    }
}