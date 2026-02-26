import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function EditProfile({ user }) {
    const [form, setForm] = useState({ first_name: '', last_name: '', mobile: '', dob: '', gender: '', country: '', language: '', content_rating: 'all', genres: [] })
    const [alert, setAlert] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/profile', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                const parts = (data.full_name || '').split(' ')
                setForm(prev => ({
                    ...prev,
                    first_name: parts[0] || '',
                    last_name: parts.slice(1).join(' ') || '',
                    mobile: data.mobile || '',
                }))
            })
            .catch(() => { })
    }, [])

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

    const handleGenre = e => {
        const val = e.target.value
        setForm(prev => ({
            ...prev,
            genres: e.target.checked ? [...prev.genres, val] : prev.genres.filter(g => g !== val)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setAlert(null)
        try {
            const res = await fetch('/api/profile/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ first_name: form.first_name, last_name: form.last_name, mobile: form.mobile }),
            })
            const data = await res.json()
            if (data.success) {
                setAlert({ type: 'success', msg: 'Profile updated successfully!' })
                setTimeout(() => navigate('/profile'), 1500)
            } else {
                setAlert({ type: 'error', msg: data.message || 'Error updating profile.' })
            }
        } catch {
            setAlert({ type: 'error', msg: 'Something went wrong. Please try again.' })
        }
    }

    const GENRES = ['action', 'comedy', 'drama', 'horror', 'romance', 'scifi', 'thriller', 'animation', 'documentary']

    return (
        <>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          min-height: 100vh; display: flex; justify-content: center;
          padding: 40px 20px; position: relative; overflow-y: auto;
        }
        .container {
          background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); padding: 50px 40px; border-radius: 20px;
          box-shadow: 0 20px 80px rgba(244,163,0,0.3); max-width: 700px; width: 100%;
          border: 2px solid rgba(244,163,0,0.3); position: relative; z-index: 1; align-self: flex-start;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { height: 60px; margin-bottom: 20px; filter: drop-shadow(0 4px 12px rgba(244,163,0,0.5)); }
        h1 { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 10px; }
        .subtitle { color: rgba(255,255,255,0.7); font-size: 14px; }
        .alert { padding: 14px 18px; border-radius: 12px; margin-bottom: 25px; font-size: 14px; animation: slideDown 0.4s; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        .alert-success { background: rgba(76,175,80,0.2); color: #4caf50; border: 2px solid rgba(76,175,80,0.5); }
        .alert-error { background: rgba(244,67,54,0.2); color: #f44336; border: 2px solid rgba(244,67,54,0.5); }
        .section-title { color: #f4a300; font-size: 16px; font-weight: 700; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(244,163,0,0.2); }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.9); font-weight: 600; font-size: 14px; }
        .required { color: #f4a300; }
        input[type="text"], input[type="tel"], input[type="date"], select {
          width: 100%; padding: 14px 16px; border: 2px solid rgba(244,163,0,0.3);
          border-radius: 10px; font-size: 14px; transition: all 0.3s;
          font-family: 'Poppins', sans-serif; background: rgba(255,255,255,0.05); color: #fff;
        }
        input:focus, select:focus { outline: none; border-color: #f4a300; background: rgba(255,255,255,0.1); box-shadow: 0 0 0 4px rgba(244,163,0,0.2); }
        input::placeholder { color: rgba(255,255,255,0.4); }
        select option { background: #000; color: #fff; }
        .helper-text { font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 5px; }
        .genre-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .genre-item { display: flex; align-items: center; gap: 8px; }
        .genre-item input[type="checkbox"] { width: 16px; height: 16px; accent-color: #f4a300; cursor: pointer; }
        .genre-item label { margin: 0; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.8); }
        .button-group { display: flex; gap: 15px; margin-top: 30px; }
        .btn {
          flex: 1; padding: 16px; border-radius: 10px; font-size: 16px; font-weight: 700; cursor: pointer;
          transition: all 0.4s; text-transform: uppercase; letter-spacing: 1px; text-decoration: none;
          display: inline-block; text-align: center; border: none; font-family: 'Poppins', sans-serif;
        }
        .btn-primary { background: linear-gradient(135deg, #f4a300, #ff8c00); color: #000; box-shadow: 0 8px 25px rgba(244,163,0,0.4); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 35px rgba(244,163,0,0.6); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border: 2px solid rgba(244,163,0,0.3) !important; }
        .btn-secondary:hover { background: rgba(244,163,0,0.15); border-color: #f4a300 !important; color: #f4a300; }
        @media (max-width: 768px) {
          .container { padding: 35px 25px; }
          h1 { font-size: 26px; }
          .form-row { grid-template-columns: 1fr; }
          .genre-grid { grid-template-columns: repeat(2, 1fr); }
          .button-group { flex-direction: column; }
        }
      `}</style>
            <div className="page">
                <div className="container">
                    <div className="header">
                        <img src="/static/logo.png" alt="ChitraStream" className="logo" />
                        <h1>Edit Profile</h1>
                        <p className="subtitle">Personalize your movie experience</p>
                    </div>
                    {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="section-title">👤 Personal Information</div>
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
                        <div className="form-row">
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" name="dob" value={form.dob} onChange={handleChange} />
                                <p className="helper-text">For age-appropriate content recommendations</p>
                            </div>
                            <div className="form-group">
                                <label>Gender</label>
                                <select name="gender" value={form.gender} onChange={handleChange}>
                                    <option value="">Prefer not to say</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="section-title">📱 Contact Information</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input type="tel" name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
                            </div>
                            <div className="form-group">
                                <label>Country</label>
                                <select name="country" value={form.country} onChange={handleChange}>
                                    <option value="">Select Country</option>
                                    <option value="IN">India</option>
                                    <option value="US">United States</option>
                                    <option value="UK">United Kingdom</option>
                                    <option value="CA">Canada</option>
                                    <option value="AU">Australia</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="section-title">🎬 Movie Preferences</div>
                        <div className="form-group">
                            <label>Favorite Genres</label>
                            <div className="genre-grid">
                                {GENRES.map(g => (
                                    <div key={g} className="genre-item">
                                        <input type="checkbox" id={g} value={g} checked={form.genres.includes(g)} onChange={handleGenre} />
                                        <label htmlFor={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</label>
                                    </div>
                                ))}
                            </div>
                            <p className="helper-text">Select your favorite genres for personalized recommendations</p>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Preferred Language</label>
                                <select name="language" value={form.language} onChange={handleChange}>
                                    <option value="">Select Language</option>
                                    <option value="hindi">Hindi</option>
                                    <option value="english">English</option>
                                    <option value="tamil">Tamil</option>
                                    <option value="telugu">Telugu</option>
                                    <option value="malayalam">Malayalam</option>
                                    <option value="kannada">Kannada</option>
                                    <option value="bengali">Bengali</option>
                                    <option value="marathi">Marathi</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Content Rating Preference</label>
                                <select name="content_rating" value={form.content_rating} onChange={handleChange}>
                                    <option value="all">All Content</option>
                                    <option value="U">U (Universal)</option>
                                    <option value="UA">UA (Parental Guidance)</option>
                                    <option value="A">A (Adults Only)</option>
                                </select>
                            </div>
                        </div>
                        <div className="button-group">
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                            <Link to="/profile" className="btn btn-secondary">Cancel</Link>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}
