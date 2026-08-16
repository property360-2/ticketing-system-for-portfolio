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
[Route("api/v1/tickets/{ticketId:int}/comments")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CommentsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int ticketId)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var comments = await _db.TicketComments
            .AsNoTracking()
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentResponse(c.Id, c.Content, c.UserId, c.User.Name, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(comments);
    }

    [HttpPost]
    public async Task<IActionResult> Create(int ticketId, [FromBody] CreateCommentRequest request)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var comment = new TicketComment
        {
            TicketId = ticketId,
            UserId = User.GetUserId(),
            Content = request.Content
        };

        _db.TicketComments.Add(comment);
        await _db.SaveChangesAsync();

        ActivityLogger.Add(_db, access.Ticket!, User.GetUserId(), ActivityAction.COMMENT_ADDED,
            null, request.Content);

        await _db.SaveChangesAsync();

        return StatusCode(201, new CommentResponse(
            comment.Id,
            comment.Content,
            comment.UserId,
            (await _db.Users.FindAsync(comment.UserId))?.Name ?? string.Empty,
            comment.CreatedAt,
            comment.UpdatedAt));
    }

    [HttpPut("{commentId:int}")]
    public async Task<IActionResult> Update(int ticketId, int commentId, [FromBody] UpdateCommentRequest request)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var comment = await _db.TicketComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId);

        if (comment is null)
        {
            return NotFound(new { message = "Comment not found." });
        }

        if (!CanManageComment(comment.UserId))
        {
            return Forbid();
        }

        comment.Content = request.Content;
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new CommentResponse(
            comment.Id,
            comment.Content,
            comment.UserId,
            (await _db.Users.FindAsync(comment.UserId))?.Name ?? string.Empty,
            comment.CreatedAt,
            comment.UpdatedAt));
    }

    [HttpDelete("{commentId:int}")]
    public async Task<IActionResult> Delete(int ticketId, int commentId)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var comment = await _db.TicketComments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.TicketId == ticketId);

        if (comment is null)
        {
            return NotFound(new { message = "Comment not found." });
        }

        if (!CanManageComment(comment.UserId))
        {
            return Forbid();
        }

        _db.TicketComments.Remove(comment);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private bool CanManageComment(string commentUserId)
    {
        return User.GetUserRole() == RoleNames.Admin || User.GetUserId() == commentUserId;
    }

    private async Task<(Ticket? Ticket, IActionResult? Error)> GetAccessibleTicketAsync(int ticketId)
    {
        var ticket = await _db.Tickets.AsNoTracking().FirstOrDefaultAsync(t => t.Id == ticketId);
        if (ticket is null)
        {
            return (null, NotFound(new { message = "Ticket not found." }));
        }

        var role = User.GetUserRole() ?? RoleNames.Employee;
        var userId = User.GetUserId();

        if (!TicketAccess.CanView(role, userId, ticket))
        {
            return (null, Forbid());
        }

        return (ticket, null);
    }
}