import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function Profile({ user, setUser }) {
    const [profile, setProfile] = useState(null)
    const navigate = useNavigate()

    useEffect(() => {
        fetch('/api/profile', { credentials: 'include' })
            .then(r => r.json())
            .then(data => setProfile(data))
            .catch(() => { })
    }, [])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        setUser(null)
        navigate('/login')
    }

    const userName = profile?.full_name || user?.username || 'User'
    const userEmail = profile?.email || user?.email || ''

    return (
        <>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; }
        .page {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%);
          color: #fff; min-height: 100vh;
        }
        .navbar {
          background: rgba(0,0,0,0.95); padding: 20px 50px;
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 2px solid rgba(244,163,0,0.3);
        }
        .brand-logo { height: 70px; filter: drop-shadow(0 4px 12px rgba(244,163,0,0.5)); cursor: pointer; }
        .nav-links { display: flex; gap: 30px; align-items: center; }
        .nav-links a { color: rgba(255,255,255,0.8); text-decoration: none; font-weight: 600; font-size: 14px; transition: color 0.3s; }
        .nav-links a:hover { color: #f4a300; }
        .logout-link { background: #dc2626; padding: 8px 18px; border-radius: 6px; text-decoration: none; color: white; font-weight: 600; font-size: 14px; transition: all 0.3s; cursor: pointer; border: none; font-family: 'Poppins', sans-serif; }
        .logout-link:hover { background: #b91c1c; }
        .container { max-width: 1100px; margin: 50px auto; padding: 0 30px; }
        .profile-header { background: rgba(0,0,0,0.6); border: 2px solid rgba(244,163,0,0.3); border-radius: 20px; padding: 40px 50px; text-align: center; margin-bottom: 30px; backdrop-filter: blur(10px); position: relative; }
        .edit-profile-btn { position: absolute; top: 20px; right: 20px; background: rgba(244,163,0,0.1); border: 2px solid rgba(244,163,0,0.3); color: #f4a300; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .edit-profile-btn:hover { background: rgba(244,163,0,0.2); border-color: #f4a300; transform: translateY(-2px); }
        .profile-avatar { width: 100px; height: 100px; background: linear-gradient(135deg, #f4a300, #ff8c00); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 900; margin: 0 auto 20px; box-shadow: 0 15px 40px rgba(244,163,0,0.4); color: #000; }
        .profile-name { font-size: 32px; font-weight: 900; background: linear-gradient(135deg, #f4a300 0%, #ff8c00 50%, #f4a300 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 8px; }
        .profile-email { color: rgba(255,255,255,0.6); font-size: 15px; }
        .content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 30px; margin-bottom: 30px; }
        .profile-section { background: rgba(0,0,0,0.6); border: 2px solid rgba(244,163,0,0.3); border-radius: 20px; padding: 35px; backdrop-filter: blur(10px); }
        .section-title { color: #f4a300; font-size: 20px; font-weight: 700; margin-bottom: 25px; display: flex; align-items: center; gap: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .info-item { background: rgba(255,255,255,0.03); padding: 18px; border-radius: 10px; border: 1px solid rgba(244,163,0,0.15); }
        .info-label { color: #f4a300; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .info-value { color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500; }
        .stats-grid { display: grid; grid-template-columns: 1fr; gap: 15px; }
        .stat-card { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 10px; text-align: center; border: 1px solid rgba(244,163,0,0.15); }
        .stat-number { font-size: 28px; font-weight: 900; color: #f4a300; margin-bottom: 5px; }
        .stat-label { color: rgba(255,255,255,0.7); font-size: 13px; }
        .action-buttons { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .btn { padding: 14px 25px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 10px; text-align: center; font-family: 'Poppins', sans-serif; border: none; }
        .btn-primary { background: linear-gradient(135deg, #f4a300, #ff8c00); color: #000; box-shadow: 0 6px 20px rgba(244,163,0,0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(244,163,0,0.5); }
        .btn-secondary { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.8); border: 2px solid rgba(244,163,0,0.3) !important; }
        .btn-secondary:hover { background: rgba(244,163,0,0.15); border-color: #f4a300 !important; color: #f4a300; }
        .btn-danger { background: rgba(220,38,38,0.1); color: #dc2626; border: 2px solid rgba(220,38,38,0.3) !important; }
        .btn-danger:hover { background: rgba(220,38,38,0.2); border-color: #dc2626 !important; }
        @media (max-width: 968px) {
          .content-grid { grid-template-columns: 1fr; }
          .navbar { padding: 15px 20px; }
          .brand-logo { height: 50px; }
          .container { padding: 0 20px; }
          .profile-header { padding: 35px 25px; }
          .edit-profile-btn { position: static; margin-top: 20px; }
          .profile-section { padding: 25px 20px; }
        }
      `}</style>
            <div className="page">
                <nav className="navbar">
                    <img src="/static/logo.png" alt="ChitraStream" className="brand-logo" onClick={() => navigate('/dashboard')} />
                    <div className="nav-links">
                        <Link to="/dashboard">Home</Link>
                        <Link to="/dashboard">Browse</Link>
                        <button className="logout-link" onClick={handleLogout}>Logout</button>
                    </div>
                </nav>
                <div className="container">
                    <div className="profile-header">
                        <Link to="/edit-profile" className="edit-profile-btn">
                            <span>✏️</span><span>Edit Profile</span>
                        </Link>
                        <div className="profile-avatar">{userName?.[0]?.toUpperCase() || 'U'}</div>
                        <h1 className="profile-name">{userName}</h1>
                        <p className="profile-email">{userEmail}</p>
                    </div>
                    <div className="content-grid">
                        <div>
                            <div className="profile-section" style={{ marginBottom: '30px' }}>
                                <h2 className="section-title">ℹ️ Account Information</h2>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <div className="info-label">Full Name</div>
                                        <div className="info-value">{profile?.full_name || 'Not provided'}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Email Address</div>
                                        <div className="info-value">{userEmail}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Mobile Number</div>
                                        <div className="info-value">{profile?.mobile || 'Not provided'}</div>
                                    </div>
                                    <div className="info-item">
                                        <div className="info-label">Member Since</div>
                                        <div className="info-value">{profile?.member_since || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="profile-section">
                                <h2 className="section-title">⚙️ Account Actions</h2>
                                <div className="action-buttons">
                                    <Link to="/edit-profile" className="btn btn-primary"><span>✏️</span><span>Edit Profile</span></Link>
                                    <Link to="/change-password" className="btn btn-secondary"><span>🔒</span><span>Change Password</span></Link>
                                    <Link to="/dashboard" className="btn btn-secondary"><span>🏠</span><span>Back to Dashboard</span></Link>
                                    <button className="btn btn-danger" onClick={handleLogout}><span>🚪</span><span>Logout</span></button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="profile-section">
                                <h2 className="section-title">📊 Statistics</h2>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-number">0</div>
                                        <div className="stat-label">Movies Watched</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">0</div>
                                        <div className="stat-label">In Watchlist</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-number">{profile?.days_member || 0}</div>
                                        <div className="stat-label">Days Member</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
