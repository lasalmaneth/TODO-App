import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('add')
  const [taskForm, setTaskForm] = useState({
    title: '',
    isLongTask: 'no',
    dueDate: '',
    importanceLevel: 'Medium',
  })
  const [taskMessage, setTaskMessage] = useState('')

  const handleLogin = (email) => {
    setIsAuthenticated(true)
    setUser(email)
    localStorage.setItem('user', email)
  }

  const handleRegister = (email) => {
    setIsAuthenticated(true)
    setUser(email)
    localStorage.setItem('user', email)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('user')
  }

  const tabs = [
    { id: 'add', label: 'ADD A Task' },
    { id: 'view', label: 'VIEW MY TASKS' },
    { id: 'edit', label: 'EDIT A TASK' },
    { id: 'portfolio', label: 'MY PORTFOLIO' },
    { id: 'delete', label: 'DELETE A TASK' },
  ]

  const handleTaskChange = (event) => {
    const { name, value } = event.target

    setTaskForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'isLongTask' && value === 'no' ? { dueDate: '' } : {}),
    }))
  }

  const handleCreateTask = async (event) => {
    event.preventDefault()
    setTaskMessage('')

    if (!taskForm.title.trim()) {
      setTaskMessage('Please enter a task title.')
      return
    }

    if (taskForm.isLongTask === 'yes' && !taskForm.dueDate) {
      setTaskMessage('Please choose a date for the long task.')
      return
    }

    try {
      const response = await fetch('http://localhost:5072/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskForm.title,
          isLongTask: taskForm.isLongTask === 'yes',
          dueDate: taskForm.dueDate || null,
          importanceLevel: taskForm.importanceLevel,
          ownerEmail: user,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to save task')
      }

      setTaskMessage('Task saved in SQLite successfully.')
      setTaskForm({
        title: '',
        isLongTask: 'no',
        dueDate: '',
        importanceLevel: 'Medium',
      })
      setActiveTab('view')
    } catch (error) {
      setTaskMessage(error.message)
    }
  }

  const HomePage = () => (
    <div className="home-page">
      <div className="home-header">
        <div>
          <p className="home-kicker">Welcome back</p>
          <h1>To-Do Home</h1>
          <p className="home-subtitle">Choose one of the actions below to manage your work.</p>
        </div>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>

      <div className="home-tabs" role="tablist" aria-label="Task actions">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`home-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="home-panel">
        {activeTab === 'add' ? (
          <form className="task-form" onSubmit={handleCreateTask}>
            <h2>Add a Task</h2>
            <p>Fill in the task title, mark if it is long, choose a date if needed, and set importance.</p>

            <label>
              Task Title
              <input
                type="text"
                name="title"
                value={taskForm.title}
                onChange={handleTaskChange}
                placeholder="Enter task title"
              />
            </label>

            <label>
              Is it a long task?
              <select name="isLongTask" value={taskForm.isLongTask} onChange={handleTaskChange}>
                <option value="no">No, it is a short task</option>
                <option value="yes">Yes, it is a long task</option>
              </select>
            </label>

            {taskForm.isLongTask === 'yes' && (
              <label>
                Select Date
                <input
                  type="date"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                />
              </label>
            )}

            <label>
              Importance Level
              <select name="importanceLevel" value={taskForm.importanceLevel} onChange={handleTaskChange}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>

            <button type="submit" className="task-submit-button">Save Task</button>

            {taskMessage && <p className="task-message">{taskMessage}</p>}
          </form>
        ) : (
          <>
            <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
            <p>
              This section is ready for your task workflow. You can connect this button to a real form or task list next.
            </p>
          </>
        )}
      </div>
    </div>
  )

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={<Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={<Register onRegister={handleRegister} />} 
        />
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
