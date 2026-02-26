import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Signup({ setUser }) {
    const [form, setForm] = useState({ first_name: '', last_name: '', email: '', mobile: '', password: '', confirm_password: '' })
    const [alert, setAlert] = useState(null)
    const navigate = useNavigate()

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAlert(null)
        if (form.password !== form.confirm_password) {
            setAlert({ type: 'error', msg: 'Passwords do not match!' })
            return
        }
        try {
            const username = `${form.first_name} ${form.last_name}`.trim()
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, email: form.email, password: form.password, mobile: form.mobile }),
            })
            const data = await res.json()
            if (data.success) {
                setUser(data.user)
                navigate('/dashboard')
            } else {
                setAlert({ type: 'error', msg: data.message || 'Error creating account.' })
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
          background: radial-gradient(circle at 20% 50%, rgba(244,163,0,0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255,140,0,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .container {
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(20px);
          padding: 50px 40px;
          border-radius: 20px;
          box-shadow: 0 20px 80px rgba(244,163,0,0.3);
          max-width: 500px;
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
        }
        h1 {
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 36px; font-weight: 900; margin-bottom: 10px; text-align: center;
        }
        .subtitle { color: rgba(255,255,255,0.7); text-align: center; font-size: 15px; margin-bottom: 30px; }
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
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 14px; position: static; pointer-events: auto; transform: none; }
        .required { color: #f4a300; }
        input {
          width: 100%; padding: 14px 16px; border: 2px solid rgba(244,163,0,0.3);
          border-radius: 10px; font-size: 14px; transition: all 0.3s;
          font-family: 'Poppins', sans-serif; background: rgba(255,255,255,0.05); color: #fff; height: auto;
        }
        input:focus { outline: none; border-color: #f4a300; background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(244,163,0,0.2); }
        input::placeholder { color: rgba(255,255,255,0.4); }
        small { display: block; margin-top: 6px; color: rgba(255,255,255,0.5); font-size: 12px; }
        .btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          background-size: 200% 200%; color: #000; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.4s;
          margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; height: auto;
          box-shadow: 0 8px 25px rgba(244,163,0,0.4); font-family: 'Poppins', sans-serif;
        }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(244,163,0,0.6); background-position: 100% 50%; }
        .btn:active { transform: translateY(-1px); }
        .login-link {
          text-align: center; margin-top: 25px; padding-top: 25px;
          border-top: 1px solid rgba(244,163,0,0.2);
        }
        .login-link p { color: rgba(255,255,255,0.7); font-size: 14px; }
        .login-link a { color: #f4a300; text-decoration: none; font-weight: 600; transition: all 0.3s; margin-left: 5px; }
        .login-link a:hover { color: #ff8c00; }
        @media (max-width: 600px) {
          .container { padding: 35px 25px; }
          .form-row { grid-template-columns: 1fr; }
          h1 { font-size: 28px; }
        }
      `}</style>
            <div className="page">
                <div className="container">
                    <div className="logo-container">
                        <img src="/static/logo.png" alt="ChitraStream" className="logo" />
                        <h1>Join ChitraStream</h1>
                        <p className="subtitle">Your premium entertainment destination</p>
                    </div>
                    {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name <span className="required">*</span></label>
                                <input type="text" name="first_name" value={form.first_name} onChange={handleChange} placeholder="John" required />
                            </div>
                            <div className="form-group">
                                <label>Last Name <span className="required">*</span></label>
                                <input type="text" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Doe" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email Address <span className="required">*</span></label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john.doe@example.com" required />
                            <small>We'll never share your email</small>
                        </div>
                        <div className="form-group">
                            <label>Mobile Number</label>
                            <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
                        </div>
                        <div className="form-group">
                            <label>Password <span className="required">*</span></label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" minLength="8" required />
                            <small>Minimum 8 characters</small>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password <span className="required">*</span></label>
                            <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="btn">Create Account</button>
                    </form>
                    <div className="login-link">
                        <p>Already have an account? <Link to="/login">Sign In</Link></p>
                    </div>
                </div>
            </div>
        </>
    )
}
