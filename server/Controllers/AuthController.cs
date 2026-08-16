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

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtService _jwtService;
    private readonly ApplicationDbContext _db;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        JwtService jwtService,
        ApplicationDbContext db)
    {
        _userManager = userManager;
        _jwtService = jwtService;
        _db = db;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
        {
            return Conflict(new { message = "Email is already registered." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            Name = request.Name,
            IsActive = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
        }

        await _userManager.AddToRoleAsync(user, RoleNames.Employee);

        return StatusCode(201, await BuildAuthResponseAsync(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Your account is deactivated." });
        }

        return Ok(await BuildAuthResponseAsync(user));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId());
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? RoleNames.Employee;

        return Ok(new UserResponse(
            user.Id,
            user.Name,
            user.Email ?? string.Empty,
            role,
            user.DepartmentId,
            await GetDepartmentNameAsync(user.DepartmentId),
            user.IsActive,
            user.CreatedAt));
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId());
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        user.Name = request.Name;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }

    [HttpPut("me/password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(User.GetUserId());
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(e => e.Description)) });
        }

        return NoContent();
    }

    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => NoContent();

    private async Task<AuthResponse> BuildAuthResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? RoleNames.Employee;
        var token = _jwtService.CreateToken(user, roles);

        return new AuthResponse(token, user.Id, user.Name, user.Email ?? string.Empty, role, user.IsActive);
    }

    private async Task<string?> GetDepartmentNameAsync(int? departmentId)
    {
        if (departmentId is null)
        {
            return null;
        }

        return await _db.Departments
            .Where(d => d.Id == departmentId)
            .Select(d => d.Name)
            .FirstOrDefaultAsync();
    }
}