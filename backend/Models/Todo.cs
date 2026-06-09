using System.ComponentModel.DataAnnotations;

namespace TodoApp.Models;

public class Todo
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MinLength(1)]
    public string Title { get; set; } = string.Empty;

    public bool IsCompleted { get; set; } = false;

    public DateTime? DueDate { get; set; }
}
