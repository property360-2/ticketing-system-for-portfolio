using HelpDesk.Api.Data;
using HelpDesk.Api.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HelpDesk.Api.Controllers;

[ApiController]
[Route("api/v1/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CategoriesController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryResponse(c.Id, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryResponse(c.Id, c.Name, c.Description, c.CreatedAt, c.UpdatedAt))
            .FirstOrDefaultAsync();

        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        return Ok(category);
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        if (await _db.Categories.AnyAsync(c => c.Name == request.Name))
        {
            return Conflict(new { message = "A category with this name already exists." });
        }

        var category = new Models.Entities.Category
        {
            Name = request.Name,
            Description = request.Description
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        return StatusCode(201, new CategoryResponse(
            category.Id,
            category.Name,
            category.Description,
            category.CreatedAt,
            category.UpdatedAt));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        if (await _db.Categories.AnyAsync(c => c.Name == request.Name && c.Id != id))
        {
            return Conflict(new { message = "A category with this name already exists." });
        }

        category.Name = request.Name;
        category.Description = request.Description;
        category.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new CategoryResponse(
            category.Id,
            category.Name,
            category.Description,
            category.CreatedAt,
            category.UpdatedAt));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category is null)
        {
            return NotFound(new { message = "Category not found." });
        }

        if (await _db.Tickets.AnyAsync(t => t.CategoryId == id))
        {
            return Conflict(new { message = "Cannot delete a category that is used by tickets." });
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();

        return NoContent();
    }
}