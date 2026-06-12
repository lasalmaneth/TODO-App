import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('add')

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
        <h2>{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
        <p>
          This section is ready for your task workflow. You can connect this button to a real form or task list next.
        </p>
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
