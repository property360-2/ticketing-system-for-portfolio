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
[Route("api/v1/tickets/{ticketId:int}/attachments")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private const long MaxFileSize = 10 * 1024 * 1024;

    private static readonly string[] AllowedExtensions =
        [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".pdf", ".txt", ".doc", ".docx", ".xls", ".xlsx", ".zip"];

    private readonly ApplicationDbContext _db;
    private readonly AttachmentStorage _storage;

    public AttachmentsController(ApplicationDbContext db, AttachmentStorage storage)
    {
        _db = db;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int ticketId)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var attachments = await _db.TicketAttachments
            .AsNoTracking()
            .Where(a => a.TicketId == ticketId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AttachmentResponse(
                a.Id, a.FileName, a.FileSize, a.MimeType, a.UploadedById, a.UploadedBy.Name, a.CreatedAt))
            .ToListAsync();

        return Ok(attachments);
    }

    [HttpPost]
    public async Task<IActionResult> Upload(int ticketId, [FromForm] IFormFileCollection files)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var created = new List<TicketAttachment>();

        foreach (var file in files)
        {
            if (file.Length == 0)
            {
                return BadRequest(new { message = "Uploaded file is empty." });
            }

            if (file.Length > MaxFileSize)
            {
                return BadRequest(new { message = $"File exceeds the {MaxFileSize / 1024 / 1024} MB limit." });
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = $"File type '{extension}' is not allowed." });
            }

            var relativePath = await _storage.SaveAsync(file, ticketId, HttpContext.RequestAborted);

            var attachment = new TicketAttachment
            {
                TicketId = ticketId,
                UploadedById = User.GetUserId(),
                FileName = Path.GetFileName(file.FileName),
                FilePath = relativePath,
                FileSize = file.Length,
                MimeType = file.ContentType
            };

            _db.TicketAttachments.Add(attachment);
            created.Add(attachment);
        }

        await _db.SaveChangesAsync();

        var uploaderName = (await _db.Users.FindAsync(User.GetUserId()))?.Name ?? string.Empty;

        var responses = new List<AttachmentResponse>();

        foreach (var attachment in created)
        {
            ActivityLogger.Add(_db, access.Ticket!, User.GetUserId(), ActivityAction.ATTACHMENT_UPLOADED,
                null, attachment.FileName);

            responses.Add(new AttachmentResponse(
                attachment.Id,
                attachment.FileName,
                attachment.FileSize,
                attachment.MimeType,
                attachment.UploadedById,
                uploaderName,
                attachment.CreatedAt));
        }

        await _db.SaveChangesAsync();

        return StatusCode(201, responses);
    }

    [HttpGet("{attachmentId:int}/download")]
    public async Task<IActionResult> Download(int ticketId, int attachmentId)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var attachment = await _db.TicketAttachments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);

        if (attachment is null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        var fullPath = _storage.GetFullPath(attachment.FilePath);
        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { message = "Attachment file is missing." });
        }

        var bytes = await System.IO.File.ReadAllBytesAsync(fullPath, HttpContext.RequestAborted);
        return File(bytes, attachment.MimeType, attachment.FileName);
    }

    [HttpDelete("{attachmentId:int}")]
    public async Task<IActionResult> Delete(int ticketId, int attachmentId)
    {
        var access = await GetAccessibleTicketAsync(ticketId);
        if (access.Error is not null)
        {
            return access.Error;
        }

        var attachment = await _db.TicketAttachments
            .FirstOrDefaultAsync(a => a.Id == attachmentId && a.TicketId == ticketId);

        if (attachment is null)
        {
            return NotFound(new { message = "Attachment not found." });
        }

        var isAdmin = User.GetUserRole() == RoleNames.Admin;
        if (!isAdmin && attachment.UploadedById != User.GetUserId())
        {
            return Forbid();
        }

        _storage.Delete(attachment.FilePath);
        _db.TicketAttachments.Remove(attachment);
        await _db.SaveChangesAsync();

        return NoContent();
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