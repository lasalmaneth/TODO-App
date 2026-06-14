import { useState, useEffect } from 'react'
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
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [detailChecks, setDetailChecks] = useState({ completed: false, followUp: false, flagged: false })
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    isLongTask: 'no',
    dueDate: '',
    importanceLevel: 'Medium',
  })

  const storageKeyForUser = (u) => `taskDetailsStates_${u}`

  const openDetails = (task) => {
    setSelectedTask(task)
    try {
      const key = storageKeyForUser(user || 'default')
      const raw = localStorage.getItem(key)
      if (raw) {
        const map = JSON.parse(raw)
        const id = task.id ?? task.Id
        if (map && map[id]) {
          setDetailChecks(map[id])
          return
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    setDetailChecks({ completed: false, followUp: false, flagged: false })
  }

  const toggleDetailCheck = (e) => {
    const { name, checked } = e.target
    setDetailChecks((c) => ({ ...c, [name]: checked }))
  }

  const getTaskId = (task) => task.id ?? task.Id

  const openEditTask = (task) => {
    const isLongTask = task.isLongTask ?? task.IsLongTask
    setEditingTask(task)
    setEditForm({
      title: task.title ?? task.Title ?? '',
      isLongTask: isLongTask ? 'yes' : 'no',
      dueDate: (task.dueDate ?? task.DueDate ?? '').toString().slice(0, 10),
      importanceLevel: task.importanceLevel ?? task.ImportanceLevel ?? 'Medium',
    })
    setActiveTab('edit')
  }

  const handleEditTaskChange = (event) => {
    const { name, value } = event.target
    setEditForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'isLongTask' && value === 'no' ? { dueDate: '' } : {}),
    }))
  }

  const handleUpdateTask = async (event) => {
    event.preventDefault()
    if (!editingTask) return

    try {
      const response = await fetch(`http://localhost:5072/api/tasks/${getTaskId(editingTask)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          isLongTask: editForm.isLongTask === 'yes',
          dueDate: editForm.dueDate || null,
          importanceLevel: editForm.importanceLevel,
          ownerEmail: user,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update task')
      }

      setTaskMessage('Task updated successfully.')
      setEditingTask(null)
      setSelectedTask(null)
      await fetchTasks()
      setActiveTab('view')
    } catch (error) {
      setTaskMessage(error.message)
    }
  }

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(`Delete "${task.title ?? task.Title}"?`)
    if (!confirmed) return

    try {
      const response = await fetch(
        `http://localhost:5072/api/tasks/${getTaskId(task)}?ownerEmail=${encodeURIComponent(user)}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to delete task')
      }

      setTaskMessage('Task deleted successfully.')
      if (editingTask && getTaskId(editingTask) === getTaskId(task)) {
        setEditingTask(null)
      }
      if (selectedTask && getTaskId(selectedTask) === getTaskId(task)) {
        setSelectedTask(null)
      }
      await fetchTasks()
    } catch (error) {
      setTaskMessage(error.message)
    }
  }

  const saveDetailChecks = () => {
    if (!selectedTask) return
    try {
      const key = storageKeyForUser(user || 'default')
      const raw = localStorage.getItem(key)
      const map = raw ? JSON.parse(raw) : {}
      const id = selectedTask.id ?? selectedTask.Id
      map[id] = detailChecks
      localStorage.setItem(key, JSON.stringify(map))
      setTaskMessage('Details saved locally.')
    } catch (e) {
      setTaskMessage('Failed to save details: ' + e.message)
    }
  }

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

  const fetchTasks = async () => {
    if (!user) return
    setLoadingTasks(true)
    setTasksError('')
    try {
      const q = encodeURIComponent(user)
      const res = await fetch(`http://localhost:5072/api/tasks?ownerEmail=${q}`)
      if (!res.ok) throw new Error((await res.text()) || 'Failed to load tasks')
      const data = await res.json()
      setTasks(data)
    } catch (e) {
      setTasksError(e.message)
    } finally {
      setLoadingTasks(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'view' || activeTab === 'portfolio') {
      fetchTasks()
    }
  }, [activeTab, user])

  const renderTaskTable = (heading) => (
    <div>
      <h2>{heading}</h2>
      {loadingTasks ? (
        <p>Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found yet.</p>
      ) : (
        <table className="tasks-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={getTaskId(task)}>
                <td>{task.title ?? task.Title}</td>
                <td>{task.createdAt ?? task.CreatedAt}</td>
                <td className="task-actions">
                  <button type="button" onClick={() => openDetails(task)} className="view-details-button">
                    View details
                  </button>
                  <button type="button" onClick={() => openEditTask(task)} className="view-details-button">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteTask(task)} className="view-details-button danger">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedTask && (
        <div className="task-details">
          <h3>Details — {selectedTask.title ?? selectedTask.Title}</h3>
          <p><strong>Created At:</strong> {selectedTask.createdAt ?? selectedTask.CreatedAt}</p>
          <p><strong>Due Date:</strong> {selectedTask.dueDate ?? selectedTask.DueDate ?? '-'}</p>
          <p><strong>Importance:</strong> {selectedTask.importanceLevel ?? selectedTask.ImportanceLevel}</p>

          <div className="detail-checkboxes">
            <label>
              <input type="checkbox" name="completed" checked={detailChecks.completed} onChange={toggleDetailCheck} /> Completed
            </label>
            <label>
              <input type="checkbox" name="followUp" checked={detailChecks.followUp} onChange={toggleDetailCheck} /> Requires follow-up
            </label>
            <label>
              <input type="checkbox" name="flagged" checked={detailChecks.flagged} onChange={toggleDetailCheck} /> Flagged
            </label>
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={saveDetailChecks} className="task-submit-button">Save</button>
            <button type="button" onClick={() => setSelectedTask(null)} style={{ marginLeft: 8 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )

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
        ) : activeTab === 'view' ? (
          <div>
            {renderTaskTable('View My Tasks')}
            {tasksError && <p className="task-message">{tasksError}</p>}
          </div>
        ) : activeTab === 'portfolio' ? (
          <div>
            {renderTaskTable('My Portfolio')}
            {tasksError && <p className="task-message">{tasksError}</p>}
          </div>
        ) : activeTab === 'edit' ? (
          <div className="task-form">
            <h2>Edit a Task</h2>
            {editingTask ? (
              <form className="task-form" onSubmit={handleUpdateTask}>
                <label>
                  Task Title
                  <input
                    type="text"
                    name="title"
                    value={editForm.title}
                    onChange={handleEditTaskChange}
                  />
                </label>

                <label>
                  Is it a long task?
                  <select name="isLongTask" value={editForm.isLongTask} onChange={handleEditTaskChange}>
                    <option value="no">No, it is a short task</option>
                    <option value="yes">Yes, it is a long task</option>
                  </select>
                </label>

                {editForm.isLongTask === 'yes' && (
                  <label>
                    Select Date
                    <input
                      type="date"
                      name="dueDate"
                      value={editForm.dueDate}
                      onChange={handleEditTaskChange}
                    />
                  </label>
                )}

                <label>
                  Importance Level
                  <select name="importanceLevel" value={editForm.importanceLevel} onChange={handleEditTaskChange}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </label>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" className="task-submit-button">Update Task</button>
                  <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <p>Choose Edit from the task list in View My Tasks or My Portfolio.</p>
                {tasks.length > 0 && (
                  <button type="button" onClick={() => setActiveTab('view')} className="task-submit-button">
                    Go to task list
                  </button>
                )}
              </>
            )}
          </div>
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
