# Full-Stack TODO Application

A robust, decoupled task management web application built using a modern 3-Tier architecture. This project showcases structured development workflows, clean API design, and asynchronous data persistence.

## 🚀 Tech Stack

- **Frontend:** React (Vite, Axios, JavaScript/Tailwind CSS)
- **Backend:** .NET 8 Core Web API (C#)
- **Database:** SQLite via Entity Framework Core

---

## 🏛️ System Architecture

This project follows a strict **3-Tier / Client-Server Architecture** to keep the codebase modular, secure, and maintainable:

1. **Presentation Tier (Frontend):** A standalone React SPA that fully controls the user interface, client-side routing, and user interaction.
2. **Application/Logic Tier (Backend):** A decoupled .NET Web API that exposes secure endpoints, executes validation logic, and manages background tasks.
3. **Data Tier (Database):** A lightweight, file-based SQLite database (`todos.db`) managed natively via EF Core object-relational mapping.

---

## 🛠️ Features & Functional Stages

### 🟢 SE 1 — Create & List Todo
- **Backend Logic:** Implements `GET /api/todos` for record fetching and `POST /api/todos` for parsing and adding new item entities.
- **Frontend Logic:** Includes a responsive "Add Todo Form" with text validations and a real-time list display updating via React state hooks (`useEffect`).

### 🟡 SE 2 — Update & Complete Todo
- **Backend Logic:** Implements semantic HTTP mapping via `PUT /api/todos/{id}` to edit task text definitions and `PATCH /api/todos/{id}/status` to toggle task execution states.
- **Frontend Logic:** Inline editing layout coupled with highly responsive task checkboxes tracking list completion.

### 🔴 SE 3 — Delete & Filter Todo
- **Backend Logic:** Implements a strict `DELETE /api/todos/{id}` routing endpoint. Upgrades the main `GET` handler to support query-string processing (`?status=active` or `?status=completed`) to run optimized database-level queries.
- **Frontend Logic:** Clean filter tab dashboard triggers and quick task purge actions.

---

## 🌿 Git Branching Strategy & Rules

To ensure stable version control, development is organized strictly across target feature branches before reaching production:

* `main` — Stores final, tested, and fully stable code blocks only.
* `develop` — Integration branch where individual feature completions are merged first for verification.
* `feature/` branches — Isolated developer sandboxes for task tracking:
    * `feature/setup-clean-architecture`
    * `feature/todo-create-list`
    * `feature/todo-update-status`
    * `feature/todo-delete-filter`
    * `feature/final-integration-testing`

---

## ⚙️ Getting Started & Setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js & npm](https://nodejs.org/)

### 1. Backend Setup (.NET API)
```bash
cd backend
# Restore packages
dotnet restore

# Run EF Core Migrations to generate the local SQLite database
dotnet ef database update

# Boot up the server instance
dotnet run