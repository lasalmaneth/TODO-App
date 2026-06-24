using Microsoft.EntityFrameworkCore;
using TodoApp.Models;
using TodoApp.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddDbContext<TodoContext>(options =>
    options.UseSqlite("Data Source=todos.db"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<TodoContext>();
    dbContext.Database.EnsureCreated();
    dbContext.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "TaskItems" (
            "Id" INTEGER NOT NULL CONSTRAINT "PK_TaskItems" PRIMARY KEY AUTOINCREMENT,
            "Title" TEXT NOT NULL,
            "IsLongTask" INTEGER NOT NULL,
            "DueDate" TEXT NULL,
            "ImportanceLevel" TEXT NOT NULL,
            "OwnerEmail" TEXT NOT NULL,
            "CreatedAt" TEXT NOT NULL
        );
    """);
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.MapControllers();

app.Run();

