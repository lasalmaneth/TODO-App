using System.ComponentModel.DataAnnotations;

namespace TodoApp.Models;

public class TaskItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MinLength(1)]
    public string Title { get; set; } = string.Empty;

    public bool IsLongTask { get; set; }

    public DateTime? DueDate { get; set; }

    [Required]
    public string ImportanceLevel { get; set; } = "Medium";

    [Required]
    public string OwnerEmail { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}