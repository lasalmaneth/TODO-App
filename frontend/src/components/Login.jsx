import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (email && password) {
      try {
        const response = await fetch('http://localhost:5072/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(errorText || 'Login failed')
        }

        const result = await response.json()
        onLogin(result.email)
        navigate('/')
      } catch (error) {
        alert(error.message)
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>To-Do App</h1>
        <p>Manage your tasks with robust, secure authentication</p>
      </div>

      <div className="auth-box">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Sign in to manage your tasks and agenda.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">Sign In</button>
        </form>

        <p className="auth-footer">
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  )
}

export default Login
