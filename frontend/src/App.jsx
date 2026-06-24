import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Pie } from 'react-chartjs-2'
import Login from './components/Login'
import Register from './components/Register'
import './App.css'

ChartJS.register(ArcElement, Tooltip, Legend)

const getImportanceNumeric = (level) => {
  if (!level) return 3;
  const levelStr = level.toString().trim();
  if (levelStr === '5' || levelStr === 'High') return 5;
  if (levelStr === '4') return 4;
  if (levelStr === '3' || levelStr === 'Medium') return 3;
  if (levelStr === '2') return 2;
  if (levelStr === '1' || levelStr === 'Low') return 1;
  const parsed = parseInt(levelStr, 10);
  return isNaN(parsed) ? 3 : parsed;
};

// Custom Quick Sort implementation (DSA)
// Sorts tasks by importance Level descending (highest importance/5 loads first)
// If importance levels are equal, we sort by CreatedAt descending.
function quickSortTasks(arr) {
  if (arr.length <= 1) return arr;

  const pivot = arr[Math.floor(arr.length / 2)];
  const pivotImportance = getImportanceNumeric(pivot.importanceLevel ?? pivot.ImportanceLevel);
  const pivotTime = new Date(pivot.createdAt ?? pivot.CreatedAt ?? 0).getTime();

  const left = [];
  const middle = [];
  const right = [];

  for (const task of arr) {
    const taskImportance = getImportanceNumeric(task.importanceLevel ?? task.ImportanceLevel);
    const taskTime = new Date(task.createdAt ?? task.CreatedAt ?? 0).getTime();

    if (taskImportance > pivotImportance) {
      // Higher importance should load first, so place on the left (descending order)
      left.push(task);
    } else if (taskImportance < pivotImportance) {
      right.push(task);
    } else {
      // If importance level is equal, compare by created date descending (newest first)
      if (taskTime > pivotTime) {
        left.push(task);
      } else if (taskTime < pivotTime) {
        right.push(task);
      } else {
        middle.push(task);
      }
    }
  }

  return [...quickSortTasks(left), ...middle, ...quickSortTasks(right)];
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('add')
  const [taskForm, setTaskForm] = useState({
    title: '',
    isLongTask: 'no',
    dueDate: '',
    importanceLevel: '3',
  })
  const [taskMessage, setTaskMessage] = useState('')
  const [tasks, setTasks] = useState([])
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [tasksError, setTasksError] = useState('')
  const [filterImportanceLevel, setFilterImportanceLevel] = useState('All')
  const [chartGroupBy, setChartGroupBy] = useState('importance')
  const [selectedTask, setSelectedTask] = useState(null)
  const [detailChecks, setDetailChecks] = useState({ completed: false, followUp: false, flagged: false })
  const [editingTask, setEditingTask] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    isLongTask: 'no',
    dueDate: '',
    importanceLevel: '3',
  })
  const [showNotifications, setShowNotifications] = useState(false)

  const storageKeyForUser = (u) => `taskDetailsStates_${u}`

  const getLocalTaskStatus = (task) => {
    try {
      const key = storageKeyForUser(user || 'default')
      const raw = localStorage.getItem(key)
      if (raw) {
        const map = JSON.parse(raw)
        const id = task.id ?? task.Id
        if (map && map[id]) {
          return {
            completed: map[id].completed ?? false,
            followUp: map[id].followUp ?? false,
            flagged: map[id].flagged ?? false
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    return { completed: false, followUp: false, flagged: false }
  }

  const openDetails = (task) => {
    setSelectedTask(task)
    setDetailChecks(getLocalTaskStatus(task))
  }

  const getChartData = () => {
    const counts = {};
    
    tasks.forEach(task => {
      let key = 'Unknown';
      if (chartGroupBy === 'importance') {
        const imp = getImportanceNumeric(task.importanceLevel ?? task.ImportanceLevel);
        key = `Importance ${imp}`;
      } else if (chartGroupBy === 'status') {
        const status = getLocalTaskStatus(task);
        key = status.completed ? 'Completed' : 'Pending';
      } else if (chartGroupBy === 'type') {
        const isLong = task.isLongTask ?? task.IsLongTask;
        key = isLong ? 'Long Task' : 'Short Task';
      } else if (chartGroupBy === 'flagged') {
        const status = getLocalTaskStatus(task);
        key = status.flagged ? 'Flagged' : 'Normal';
      }
      
      counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    const backgroundColors = [
      'rgba(34, 197, 94, 0.7)',
      'rgba(59, 130, 246, 0.7)',
      'rgba(245, 158, 11, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(168, 85, 247, 0.7)',
      'rgba(236, 72, 153, 0.7)',
    ];

    const borderColors = [
      'rgba(34, 197, 94, 1)',
      'rgba(59, 130, 246, 1)',
      'rgba(245, 158, 11, 1)',
      'rgba(239, 68, 68, 1)',
      'rgba(168, 85, 247, 1)',
      'rgba(236, 72, 153, 1)',
    ];

    return {
      labels,
      datasets: [
        {
          label: '# of Tasks',
          data,
          backgroundColor: backgroundColors.slice(0, labels.length),
          borderColor: borderColors.slice(0, labels.length),
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#f3fff5',
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const val = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((val / total) * 100);
            return ` ${context.label}: ${val} (${percentage}%)`;
          }
        }
      }
    }
  };

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
      importanceLevel: task.importanceLevel ?? task.ImportanceLevel ?? '3',
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
        importanceLevel: '3',
      })
      setActiveTab('view')
    } catch (error) {
      setTaskMessage(error.message)
    }
  }

  const dueSoonTasks = tasks.filter(task => {
    const isCompleted = getLocalTaskStatus(task).completed;
    if (isCompleted) return false;
    
    const isLong = task.isLongTask ?? task.IsLongTask;
    if (!isLong) return false;
    
    const dueDateStr = task.dueDate ?? task.DueDate;
    if (!dueDateStr) return false;
    
    const dueDate = new Date(dueDateStr);
    const now = new Date();
    
    // We count tasks that are overdue or due in the next 3 days
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays <= 3;
  });

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
    fetchTasks()
  }, [activeTab, user])

  const renderTaskTable = (heading) => {
    const filteredTasks = tasks.filter((task) => {
      if (filterImportanceLevel === 'All') return true;
      const level = task.importanceLevel ?? task.ImportanceLevel;
      return getImportanceNumeric(level).toString() === filterImportanceLevel;
    });

    const sortedTasks = quickSortTasks(filteredTasks);

    return (
      <div>
        <h2>{heading}</h2>
        <div className="filter-container">
          <label htmlFor="importance-filter" style={{ marginRight: '8px', fontWeight: 'bold' }}>
            Filter by Importance:
          </label>
          <select
            id="importance-filter"
            value={filterImportanceLevel}
            onChange={(e) => setFilterImportanceLevel(e.target.value)}
            className="importance-filter-select"
          >
            <option value="All">All Levels</option>
            <option value="1">1 - Lowest</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5 - Highest</option>
          </select>
        </div>

        {loadingTasks ? (
          <p>Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p>No tasks found yet.</p>
        ) : sortedTasks.length === 0 ? (
          <p>No tasks match the selected importance level.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Importance</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr key={getTaskId(task)}>
                  <td>{task.title ?? task.Title}</td>
                  <td>{task.importanceLevel ?? task.ImportanceLevel}</td>
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
            <button type="button" onClick={() => setSelectedTask(null)} className="task-close-button">Close</button>
          </div>
        </div>
      )}
    </div>
    );
  };

  const renderHomePage = () => (
    <div className="home-page">
      <div className="home-header">
        <div>
          <p className="home-kicker">Welcome back</p>
          <h1>To-Do Home</h1>
          <p className="home-subtitle">Choose one of the actions below to manage your work.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div className="notification-container" style={{ position: 'relative' }}>
            <button 
              type="button" 
              className="notification-bell-btn" 
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notifications"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bell-svg">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {dueSoonTasks.length > 0 && (
                <span className="notification-badge">{dueSoonTasks.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                <h4>Upcoming Due Tasks</h4>
                {dueSoonTasks.length === 0 ? (
                  <p className="no-notifications">No upcoming tasks are due soon.</p>
                ) : (
                  <ul className="notification-list">
                    {dueSoonTasks.map(task => {
                      const id = getTaskId(task);
                      const title = task.title ?? task.Title;
                      const dueDateStr = task.dueDate ?? task.DueDate;
                      const dueDate = new Date(dueDateStr);
                      const now = new Date();
                      const isOverdue = dueDate < now;
                      return (
                        <li key={id} className="notification-item">
                          <span className="notification-task-title">{title}</span>
                          <span className={`notification-task-due ${isOverdue ? 'overdue' : ''}`}>
                            {isOverdue ? 'Overdue: ' : 'Due: '}
                            {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
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
                <option value="1">1 - Lowest</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 - Highest</option>
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
          <div className="portfolio-dashboard">
            <div className="portfolio-grid">
              <div className="portfolio-chart-card">
                <h3>Task Breakdown</h3>
                <p className="card-subtitle">Visualize your task statistics by different attributes.</p>
                
                <div className="chart-filter-row">
                  <label htmlFor="chart-group-select">Group Chart By:</label>
                  <select
                    id="chart-group-select"
                    value={chartGroupBy}
                    onChange={(e) => setChartGroupBy(e.target.value)}
                    className="chart-select"
                  >
                    <option value="importance">Importance Level</option>
                    <option value="status">Completion Status</option>
                    <option value="type">Task Length (Short/Long)</option>
                    <option value="flagged">Flagged Status</option>
                  </select>
                </div>

                <div className="chart-container-wrapper">
                  {tasks.length === 0 ? (
                    <p className="no-chart-data">No task data available to display chart.</p>
                  ) : (
                    <Pie data={getChartData()} options={chartOptions} />
                  )}
                </div>
              </div>
              
              <div className="portfolio-stats-card">
                <h3>Portfolio Summary</h3>
                <p className="card-subtitle">Quick metrics of your current agenda.</p>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-val">{tasks.length}</span>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-val">
                      {tasks.filter(t => getLocalTaskStatus(t).completed).length}
                    </span>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-val">
                      {tasks.filter(t => getImportanceNumeric(t.importanceLevel ?? t.ImportanceLevel) === 5).length}
                    </span>
                    <span className="stat-label">Critical (5/5)</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-val">
                      {tasks.filter(t => getLocalTaskStatus(t).flagged).length}
                    </span>
                    <span className="stat-label">Flagged</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="portfolio-table-section">
              {renderTaskTable('My Portfolio Tasks')}
            </div>
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
                    <option value="1">1 - Lowest</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5 - Highest</option>
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
        ) : activeTab === 'delete' ? (
          <div>
            <h2>Delete a Task</h2>
            <p style={{ marginBottom: '15px' }}>Below is the list of tasks. Select "Delete" next to a task to permanently remove it.</p>
            {loadingTasks ? (
              <p>Loading tasks…</p>
            ) : tasks.length === 0 ? (
              <p>No tasks found yet.</p>
            ) : (
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Importance</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {quickSortTasks(tasks).map((task) => (
                    <tr key={getTaskId(task)}>
                      <td>{task.title ?? task.Title}</td>
                      <td>{task.importanceLevel ?? task.ImportanceLevel}</td>
                      <td>{task.createdAt ?? task.CreatedAt}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task)}
                          className="view-details-button danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {tasksError && <p className="task-message">{tasksError}</p>}
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
              renderHomePage()
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
