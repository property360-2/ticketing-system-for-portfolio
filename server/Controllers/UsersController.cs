using HelpDesk.Api.Data;
using HelpDesk.Api.Extensions;
using HelpDesk.Api.Models.Dtos;
using HelpDesk.Api.Models.Entities;
using HelpDesk.Api.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/users")]
[Authorize(Roles = "ADMIN")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;

    public UsersController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] int? departmentId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(u =>
                u.Name.Contains(search) || (u.Email != null && u.Email.Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(role))
        {
            var roleId = await _db.Roles.Where(r => r.Name == role).Select(r => r.Id).FirstOrDefaultAsync();
            if (roleId is not null)
            {
                query = query.Where(u => _db.UserRoles.Any(ur => ur.UserId == u.Id && ur.RoleId == roleId));
            }
        }

        if (departmentId is not null)
        {
            query = query.Where(u => u.DepartmentId == departmentId);
        }

        if (isActive is not null)
        {
            query = query.Where(u => u.IsActive == isActive);
        }

        var total = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = await ToResponsesAsync(users);

        return Ok(new PagedResult<UserResponse>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var response = (await ToResponsesAsync([user])).First();
        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        if (!RoleNames.All.Contains(request.Role))
        {
            return BadRequest(new { message = $"Invalid role. Allowed: {string.Join(", ", RoleNames.All)}." });
        }

        if (await _userManager.FindByEmailAsync(request.Email) is not null)
        {
            return Conflict(new { message = "Email is already registered." });
        }

        if (request.DepartmentId is not null && !await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
        {
            return BadRequest(new { message = "Department does not exist." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            DepartmentId = request.DepartmentId,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        var response = (await ToResponsesAsync([user])).First();
        return StatusCode(201, response);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (request.DepartmentId is not null && !await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
        {
            return BadRequest(new { message = "Department does not exist." });
        }

        user.Name = request.Name;
        user.DepartmentId = request.DepartmentId;
        await _userManager.UpdateAsync(user);

        var response = (await ToResponsesAsync([user])).First();
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await _db.Tickets.AnyAsync(t => t.CreatedById == id || t.AssignedToId == id))
        {
            return Conflict(new { message = "Cannot delete a user with tickets. Deactivate them instead." });
        }

        await _userManager.DeleteAsync(user);

        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateUserStatusRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (user.Id == User.GetUserId())
        {
            return BadRequest(new { message = "You cannot change your own status." });
        }

        user.IsActive = request.IsActive;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }

    [HttpPatch("{id}/role")]
    public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleRequest request)
    {
        if (!RoleNames.All.Contains(request.Role))
        {
            return BadRequest(new { message = $"Invalid role. Allowed: {string.Join(", ", RoleNames.All)}." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        await _userManager.RemoveFromRolesAsync(user, currentRoles);
        await _userManager.AddToRoleAsync(user, request.Role);

        return NoContent();
    }

    [HttpPatch("{id}/department")]
    public async Task<IActionResult> UpdateDepartment(string id, [FromBody] UpdateUserDepartmentRequest request)
    {
        if (request.DepartmentId is not null && !await _db.Departments.AnyAsync(d => d.Id == request.DepartmentId))
        {
            return BadRequest(new { message = "Department does not exist." });
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.DepartmentId = request.DepartmentId;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }

    private async Task<List<UserResponse>> ToResponsesAsync(IReadOnlyCollection<ApplicationUser> users)
    {
        var userIds = users.Select(u => u.Id).ToList();

        var roleMap = await _db.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Join(_db.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
            .ToListAsync();

        var rolesByUser = roleMap
            .GroupBy(x => x.UserId)
            .ToDictionary(g => g.Key, g => string.Join(",", g.Select(x => x.Name)));

        var departmentIds = users.Where(u => u.DepartmentId is not null).Select(u => u.DepartmentId).Distinct().ToList();
        var departments = await _db.Departments
            .Where(d => departmentIds.Contains(d.Id))
            .Select(d => new { d.Id, d.Name })
            .ToListAsync();

        var departmentById = departments.ToDictionary(d => d.Id, d => d.Name);

        return users.Select(u => new UserResponse(
            u.Id,
            u.Name,
            u.Email ?? string.Empty,
            rolesByUser.GetValueOrDefault(u.Id) ?? RoleNames.Employee,
            u.DepartmentId,
            u.DepartmentId is not null ? departmentById.GetValueOrDefault(u.DepartmentId.Value) : null,
            u.IsActive,
            u.CreatedAt)).ToList();
    }
}