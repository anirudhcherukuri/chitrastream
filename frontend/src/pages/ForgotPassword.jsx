import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [alert, setAlert] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAlert({ type: 'success', msg: 'If this email is registered, you will receive reset instructions shortly.' })
    }

    return (
        <>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; position: relative;
        }
        .page::before {
          content: ''; position: fixed; inset: 0;
          background: radial-gradient(circle at 20% 50%, rgba(244,163,0,0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255,140,0,0.15) 0%, transparent 50%);
          pointer-events: none;
        }
        .container {
          background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); padding: 50px 40px; border-radius: 20px;
          box-shadow: 0 20px 80px rgba(244,163,0,0.3); max-width: 450px; width: 100%;
          border: 2px solid rgba(244,163,0,0.3); position: relative; z-index: 1;
        }
        .logo-container { text-align: center; margin-bottom: 40px; }
        .logo { max-width: 200px; margin-bottom: 20px; filter: drop-shadow(0 8px 25px rgba(244,163,0,0.6)); }
        h1 {
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-size: 36px; font-weight: 900; margin-bottom: 10px; text-align: center;
        }
        .subtitle { color: rgba(255,255,255,0.7); text-align: center; font-size: 15px; margin-bottom: 30px; line-height: 1.6; }
        .alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 25px; font-size: 14px; animation: slideDown 0.4s; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .alert-success { background: rgba(76,175,80,0.2); color: #4caf50; border: 2px solid rgba(76,175,80,0.5); }
        .alert-error { background: rgba(244,67,54,0.2); color: #f44336; border: 2px solid rgba(244,67,54,0.5); }
        .form-group { margin-bottom: 24px; }
        label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 14px; }
        .required { color: #f4a300; }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); font-size: 18px; }
        input {
          width: 100%; padding: 14px 16px 14px 45px; border: 2px solid rgba(244,163,0,0.3);
          border-radius: 10px; font-size: 14px; transition: all 0.3s;
          font-family: 'Poppins', sans-serif; background: rgba(255,255,255,0.05); color: #fff;
        }
        input:focus { outline: none; border-color: #f4a300; background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(244,163,0,0.2); }
        input::placeholder { color: rgba(255,255,255,0.4); }
        .btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%);
          background-size: 200% 200%; color: #000; border: none; border-radius: 10px;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.4s;
          margin-top: 10px; text-transform: uppercase; letter-spacing: 1px;
          box-shadow: 0 8px 25px rgba(244,163,0,0.4); font-family: 'Poppins', sans-serif;
        }
        .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(244,163,0,0.6); background-position: 100% 50%; }
        .btn:active { transform: translateY(-1px); }
        .back-link { text-align: center; margin-top: 25px; padding-top: 25px; border-top: 1px solid rgba(244,163,0,0.2); }
        .back-link a { color: #f4a300; text-decoration: none; font-weight: 600; transition: all 0.3s; display: inline-flex; align-items: center; gap: 8px; }
        .back-link a:hover { color: #ff8c00; }
        @media (max-width: 600px) { .container { padding: 35px 25px; } h1 { font-size: 28px; } }
      `}</style>
            <div className="page">
                <div className="container">
                    <div className="logo-container">
                        <img src="/static/logo.jpeg" alt="ChitraStream" className="logo" />
                        <h1>Forgot Password?</h1>
                        <p className="subtitle">No worries! Enter your email and we'll send you reset instructions.</p>
                    </div>
                    {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Email Address <span className="required">*</span></label>
                            <div className="input-wrapper">
                                <span className="input-icon">📧</span>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@example.com" required autoFocus />
                            </div>
                        </div>
                        <button type="submit" className="btn">Send Reset Link</button>
                    </form>
                    <div className="back-link">
                        <Link to="/login"><span>←</span><span>Back to Login</span></Link>
                    </div>
                </div>
            </div>
        </>
    )
}
