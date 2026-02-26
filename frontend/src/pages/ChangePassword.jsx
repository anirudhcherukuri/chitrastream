import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function ChangePassword() {
    const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
    const [alert, setAlert] = useState(null)
    const navigate = useNavigate()

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAlert(null)
        if (!form.current_password || !form.new_password || !form.confirm_password) {
            setAlert({ type: 'error', msg: 'All fields are required!' })
            return
        }
        if (form.new_password !== form.confirm_password) {
            setAlert({ type: 'error', msg: 'New passwords do not match!' })
            return
        }
        if (form.new_password.length < 6) {
            setAlert({ type: 'error', msg: 'Password must be at least 6 characters!' })
            return
        }
        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            })
            const data = await res.json()
            if (data.success) {
                setAlert({ type: 'success', msg: 'Password changed successfully!' })
                setTimeout(() => navigate('/profile'), 1500)
            } else {
                setAlert({ type: 'error', msg: data.message || 'Error changing password.' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Something went wrong. Please try again.' })
        }
    }

    return (
        <>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          color: #fff; min-height: 100vh; padding: 40px 20px;
        }
        .container { max-width: 600px; margin: 0 auto; background: rgba(0,0,0,0.7); border: 2px solid rgba(244,163,0,0.3); border-radius: 20px; padding: 50px; backdrop-filter: blur(10px); }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(244,163,0,0.5)); }
        h1 { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.7); font-size: 14px; }
        .alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 25px; font-size: 14px; animation: slideDown 0.4s; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .alert-success { background: rgba(76,175,80,0.2); color: #4caf50; border: 2px solid rgba(76,175,80,0.5); }
        .alert-error { background: rgba(244,67,54,0.2); color: #f44336; border: 2px solid rgba(244,67,54,0.5); }
        .form-group { margin-bottom: 25px; }
        label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 14px; }
        .required { color: #f4a300; }
        input { width: 100%; padding: 14px 16px; border: 2px solid rgba(244,163,0,0.3); border-radius: 10px; font-size: 14px; transition: all 0.3s; font-family: 'Poppins', sans-serif; background: rgba(255,255,255,0.05); color: #fff; }
        input:focus { outline: none; border-color: #f4a300; background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(244,163,0,0.2); }
        input::placeholder { color: rgba(255,255,255,0.4); }
        .password-hint { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px; }
        .button-group { display: flex; gap: 15px; margin-top: 30px; }
        .btn { flex: 1; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.4s; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; display: inline-block; text-align: center; font-family: 'Poppins', sans-serif; }
        .btn-primary { background: linear-gradient(135deg, #f4a300, #ff8c00); color: #000; border: none; box-shadow: 0 8px 25px rgba(244,163,0,0.4); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(244,163,0,0.6); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border: 2px solid rgba(244,163,0,0.3); }
        .btn-secondary:hover { background: rgba(244,163,0,0.15); border-color: #f4a300; color: #f4a300; }
        .security-note { background: rgba(244,163,0,0.1); border-left: 4px solid #f4a300; padding: 15px; margin-top: 25px; border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.8); }
        @media (max-width: 600px) { .container { padding: 35px 25px; } h1 { font-size: 26px; } .button-group { flex-direction: column; } }
      `}</style>
            <div className="page">
                <div className="container">
                    <div className="header">
                        <img src="/static/logo.png" alt="ChitraStream" className="logo" />
                        <h1>Change Password</h1>
                        <p className="subtitle">Keep your account secure</p>
                    </div>
                    {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Current Password <span className="required">*</span></label>
                            <input type="password" name="current_password" value={form.current_password} onChange={handleChange} placeholder="Enter your current password" required />
                        </div>
                        <div className="form-group">
                            <label>New Password <span className="required">*</span></label>
                            <input type="password" name="new_password" value={form.new_password} onChange={handleChange} placeholder="Enter new password" required />
                            <p className="password-hint">Must be at least 8 characters long</p>
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password <span className="required">*</span></label>
                            <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange} placeholder="Confirm new password" required />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn btn-primary">Update Password</button>
                            <Link to="/profile" className="btn btn-secondary">Cancel</Link>
                        </div>
                    </form>
                    <div className="security-note">
                        <strong>🔒 Security Tip:</strong> Choose a strong password that includes uppercase and lowercase letters, numbers, and special characters. Never share your password with anyone.
                    </div>
                </div>
            </div>
        </>
    )
}
