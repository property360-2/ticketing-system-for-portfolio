using HelpDesk.Api.Data;
using HelpDesk.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/departments")]
[Authorize]
public class DepartmentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public DepartmentsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _db.Departments
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentResponse(d.Id, d.Name, d.Description, d.Users.Count, d.CreatedAt, d.UpdatedAt))
            .ToListAsync();

        return Ok(departments);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var department = await _db.Departments
            .Where(d => d.Id == id)
            .Select(d => new DepartmentResponse(d.Id, d.Name, d.Description, d.Users.Count, d.CreatedAt, d.UpdatedAt))
            .FirstOrDefaultAsync();

        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        return Ok(department);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create([FromBody] DepartmentRequest request)
    {
        if (await _db.Departments.AnyAsync(d => d.Name == request.Name))
        {
            return Conflict(new { message = "A department with this name already exists." });
        }

        var department = new Models.Entities.Department
        {
            Name = request.Name,
            Description = request.Description
        };

        _db.Departments.Add(department);
        await _db.SaveChangesAsync();

        return StatusCode(201, new DepartmentResponse(
            department.Id,
            department.Name,
            department.Description,
            0,
            department.CreatedAt,
            department.UpdatedAt));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(int id, [FromBody] DepartmentRequest request)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        if (await _db.Departments.AnyAsync(d => d.Name == request.Name && d.Id != id))
        {
            return Conflict(new { message = "A department with this name already exists." });
        }

        department.Name = request.Name;
        department.Description = request.Description;
        department.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new DepartmentResponse(
            department.Id,
            department.Name,
            department.Description,
            await _db.Users.CountAsync(u => u.DepartmentId == id),
            department.CreatedAt,
            department.UpdatedAt));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var department = await _db.Departments.FindAsync(id);
        if (department is null)
        {
            return NotFound(new { message = "Department not found." });
        }

        if (await _db.Users.AnyAsync(u => u.DepartmentId == id) ||
            await _db.Tickets.AnyAsync(t => t.DepartmentId == id))
        {
            return Conflict(new { message = "Cannot delete a department that has users or tickets." });
        }

        _db.Departments.Remove(department);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}