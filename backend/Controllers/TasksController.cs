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
        task.ImportanceLevel = string.IsNullOrWhiteSpace(task.ImportanceLevel) ? "3" : task.ImportanceLevel;
        task.CreatedAt = DateTime.UtcNow;

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskItem>> UpdateTask(int id, [FromBody] TaskItem updatedTask)
    {
        var task = await _context.TaskItems.FirstOrDefaultAsync(item => item.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(updatedTask.Title))
        {
            return BadRequest("Title is required.");
        }

        if (!string.IsNullOrWhiteSpace(updatedTask.OwnerEmail) &&
            !string.Equals(task.OwnerEmail, updatedTask.OwnerEmail.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Task owner does not match.");
        }

        task.Title = updatedTask.Title.Trim();
        task.IsLongTask = updatedTask.IsLongTask;
        task.DueDate = updatedTask.IsLongTask ? updatedTask.DueDate : null;
        task.ImportanceLevel = string.IsNullOrWhiteSpace(updatedTask.ImportanceLevel) ? task.ImportanceLevel : updatedTask.ImportanceLevel;

        await _context.SaveChangesAsync();
        return Ok(task);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTask(int id, [FromQuery] string? ownerEmail = null)
    {
        var task = await _context.TaskItems.FirstOrDefaultAsync(item => item.Id == id);
        if (task is null)
        {
            return NotFound();
        }

        if (!string.IsNullOrWhiteSpace(ownerEmail) &&
            !string.Equals(task.OwnerEmail, ownerEmail.Trim().ToLowerInvariant(), StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest("Task owner does not match.");
        }

        _context.TaskItems.Remove(task);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}