using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoApp.Data;
using TodoApp.Models;

namespace TodoApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly TodoContext _context;

    public AuthController(TodoContext context)
    {
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var existingUser = await _context.Users.AnyAsync(user => user.Email == normalizedEmail);
        if (existingUser)
        {
            return Conflict("A user with this email already exists.");
        }

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(Register), new { id = user.Id }, new { user.Id, user.Email, user.CreatedAt });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var passwordHash = HashPassword(request.Password);

        var user = await _context.Users
            .FirstOrDefaultAsync(item => item.Email == normalizedEmail && item.PasswordHash == passwordHash);

        if (user is null)
        {
            return Unauthorized("Invalid email or password.");
        }

        return Ok(new { user.Id, user.Email, user.CreatedAt });
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }
}

public sealed record AuthRequest(string Email, string Password);