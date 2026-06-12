using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApp.Data;
using TodoApp.Models;

namespace TodoApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly TodoContext _context;

    public TasksController(TodoContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks([FromQuery] string? ownerEmail = null)
    {
        var query = _context.TaskItems.AsQueryable();

        if (!string.IsNullOrWhiteSpace(ownerEmail))
        {
            query = query.Where(task => task.OwnerEmail == ownerEmail.Trim().ToLowerInvariant());
        }

        var tasks = await query.OrderByDescending(task => task.CreatedAt).ToListAsync();
        return Ok(tasks);
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> CreateTask([FromBody] TaskItem task)
    {
        if (string.IsNullOrWhiteSpace(task.Title))
        {
            return BadRequest("Title is required.");
        }

        if (string.IsNullOrWhiteSpace(task.OwnerEmail))
        {
            return BadRequest("Owner email is required.");
        }

        task.OwnerEmail = task.OwnerEmail.Trim().ToLowerInvariant();
        task.ImportanceLevel = string.IsNullOrWhiteSpace(task.ImportanceLevel) ? "Medium" : task.ImportanceLevel;
        task.CreatedAt = DateTime.UtcNow;

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
    }
}