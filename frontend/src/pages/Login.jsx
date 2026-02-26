import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Login({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [alert, setAlert] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAlert(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        navigate('/dashboard')
      } else {
        setAlert({ type: 'error', msg: data.message || 'Invalid email or password!' })
      }
    } catch {
      setAlert({ type: 'error', msg: 'Something went wrong. Please try again.' })
    }
  }

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          min-height: 100vh;
        }
        .page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow-y: auto;
        }
        .page::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at 30% 40%, rgba(244,163,0,0.2) 0%, transparent 50%),
                      radial-gradient(circle at 70% 70%, rgba(255,140,0,0.2) 0%, transparent 50%);
          pointer-events: none;
        }
        .container {
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(20px);
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 80px rgba(244,163,0,0.3);
          max-width: 450px;
          width: 100%;
          border: 2px solid rgba(244,163,0,0.3);
          position: relative;
          z-index: 1;
          align-self: flex-start;
        }
        .logo-container { text-align: center; margin-bottom: 40px; }
        .logo {
          max-width: 200px;
          margin-bottom: 20px;
          filter: drop-shadow(0 8px 25px rgba(244,163,0,0.6));
          animation: logoFloat 3s ease-in-out infinite;
        }
        @keyframes logoFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        h1 {
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 36px; font-weight: 900; margin-bottom: 10px;
        }
        .subtitle { color: rgba(255,255,255,0.7); font-size: 15px; }
        .alert {
          padding: 14px 18px; border-radius: 12px; margin-bottom: 25px;
          font-size: 14px; animation: slideDown 0.4s;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .alert-success { background: rgba(76,175,80,0.2); color: #4caf50; border: 2px solid rgba(76,175,80,0.5); }
        .alert-error { background: rgba(244,67,54,0.2); color: #f44336; border: 2px solid rgba(244,67,54,0.5); }
        .form-group { margin-bottom: 24px; }
        label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 14px; position: static; pointer-events: auto; transform: none; }
        input {
          width: 100%; padding: 14px 16px; border: 2px solid rgba(244,163,0,0.3);
          border-radius: 10px; font-size: 14px; transition: all 0.3s;
          font-family: 'Poppins', sans-serif; background: rgba(255,255,255,0.05); color: #fff; height: auto;
        }
        input:focus { outline: none; border-color: #f4a300; background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(244,163,0,0.2); }
        input::placeholder { color: rgba(255,255,255,0.4); }
        .btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          background-size: 200% 200%; color: #000; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.4s;
          margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; height: auto;
          box-shadow: 0 8px 25px rgba(244,163,0,0.4); font-family: 'Poppins', sans-serif;
        }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(244,163,0,0.6); background-position: 100% 50%; }
        .btn:active { transform: translateY(-1px); }
        .links {
          text-align: center; margin-top: 30px; padding-top: 25px;
          display: block; color: inherit; font-size: inherit; font-weight: inherit; flex-direction: row;
          border-top: 1px solid rgba(244,163,0,0.2);
        }
        .links a { color: #f4a300; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.3s; }
        .links a:hover { color: #ff8c00; text-decoration: none; }
        .signup-link { margin-top: 15px; color: rgba(255,255,255,0.7); font-size: 14px; }
        @media (max-width: 600px) {
          .container { padding: 35px 25px; }
          h1 { font-size: 28px; }
        }
      `}</style>
      <div className="page">
        <div className="container">
          <div className="logo-container">
            <img src="/static/logo.png" alt="ChitraStream" className="logo" />
            <h1>Welcome Back</h1>
            <p className="subtitle">Sign in to your account</p>
          </div>
          {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john.doe@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn" onClick={handleSubmit} style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>Sign In</button>
          </form>
          <div className="links">
            <Link to="/forgot-password">Forgot Password?</Link>
            <p className="signup-link">Don't have an account? <Link to="/signup">Create Account</Link></p>
          </div>
        </div>
      </div>
    </>
  )
}
