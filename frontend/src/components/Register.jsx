import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Auth.css'

function Register({ onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email && password && confirmPassword) {
      if (password !== confirmPassword) {
        alert('Passwords do not match')
        return
      }
      onRegister(email)
      navigate('/')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <h1>To-Do App</h1>
        <p>Manage your tasks with robust, secure authentication</p>
      </div>

      <div className="auth-box">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Sign up to get started with your tasks.</p>

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

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">Register</button>
        </form>

        <p className="auth-footer">
          Already have an account? <a href="/login">Sign in here</a>
        </p>
      </div>
    </div>
  )
}

export default Register
