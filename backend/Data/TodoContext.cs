using Microsoft.EntityFrameworkCore;
using TodoApp.Models;

namespace TodoApp.Data {
    public class TodoContext : DbContext {
        public TodoContext(DbContextOptions<TodoContext> options) : base(options) {}
        public DbSet<Todo> Todos { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>()
                .HasIndex(user => user.Email)
                .IsUnique();
        }
    }
}
