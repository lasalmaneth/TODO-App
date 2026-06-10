using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApp.Models;
using TodoApp.Data;

namespace TodoApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodosController : ControllerBase
    {
        private readonly TodoContext _context;
        public TodosController(TodoContext context)
        {
            _context = context;
        }

        // GET: api/todos?status=active|completed|all (optional)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Todo>>> GetTodos([FromQuery] string status = "all")
        {
            IQueryable<Todo> query = _context.Todos.AsQueryable();
            if (status.Equals("active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => !t.IsCompleted);
            else if (status.Equals("completed", StringComparison.OrdinalIgnoreCase))
                query = query.Where(t => t.IsCompleted);

            var todos = await query.ToListAsync();
            return Ok(todos);
        }

        // GET: api/todos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Todo>> GetTodo(int id)
        {
            var todo = await _context.Todos.FindAsync(id);
            if (todo == null) return NotFound();
            return Ok(todo);
        }

        // POST: api/todos
        [HttpPost]
        public async Task<ActionResult<Todo>> CreateTodo([FromBody] Todo todo)
        {
            if (string.IsNullOrWhiteSpace(todo.Title))
                return BadRequest("Title cannot be empty.");

            todo.IsCompleted = false; // ensure default
            _context.Todos.Add(todo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTodo), new { id = todo.Id }, todo);
        }

        // PUT: api/todos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTodo(int id, [FromBody] Todo updatedTodo)
        {
            if (id != updatedTodo.Id)
                return BadRequest("ID mismatch.");

            var existing = await _context.Todos.FindAsync(id);
            if (existing == null) return NotFound();

            existing.Title = updatedTodo.Title;
            existing.DueDate = updatedTodo.DueDate;
            existing.IsCompleted = updatedTodo.IsCompleted;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // PATCH: api/todos/5/status
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var todo = await _context.Todos.FindAsync(id);
            if (todo == null) return NotFound();

            todo.IsCompleted = !todo.IsCompleted;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/todos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodo(int id)
        {
            var todo = await _context.Todos.FindAsync(id);
            if (todo == null) return NotFound();

            _context.Todos.Remove(todo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
