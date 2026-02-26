import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STARTUP_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .startup-page { font-family: 'Poppins', sans-serif; background: #000; overflow: hidden; height: 100vh; display: flex; justify-content: center; align-items: center; position: relative; }
  .startup-container { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
  .logo-wrapper { position: relative; transform: scale(0.3); opacity: 0; animation: logoZoom 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  @keyframes logoZoom { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  .logo-image { max-width: 600px; width: 90vw; filter: drop-shadow(0 0 30px rgba(244, 163, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 140, 0, 0.6)); animation: glow 2s ease-in-out infinite alternate; }
  @keyframes glow { from { filter: drop-shadow(0 0 30px rgba(244, 163, 0, 0.8)) drop-shadow(0 0 60px rgba(255, 140, 0, 0.6)); } to { filter: drop-shadow(0 0 50px rgba(244, 163, 0, 1)) drop-shadow(0 0 100px rgba(255, 140, 0, 0.8)); } }
  .film-strip { position: absolute; width: 60px; height: 100%; background: repeating-linear-gradient(0deg, transparent, transparent 30px, rgba(244, 163, 0, 0.2) 30px, rgba(244, 163, 0, 0.4) 40px); animation: filmRoll 1.5s linear infinite; opacity: 0.5; }
  .film-strip.left { left: 10%; }
  .film-strip.right { right: 10%; animation-delay: 0.3s; }
  @keyframes filmRoll { 0% { background-position: 0 0; } 100% { background-position: 0 70px; } }
  .particle { position: absolute; width: 4px; height: 4px; background: linear-gradient(135deg, #f4a300, #ff8c00); border-radius: 50%; opacity: 0; animation: particleFloat 3s ease-in-out infinite; }
  @keyframes particleFloat { 0%, 100% { opacity: 0; transform: translateY(0) scale(0); } 50% { opacity: 1; transform: translateY(-100px) scale(1); } }
  .particle:nth-child(1) { left: 20%; animation-delay: 0s; }
  .particle:nth-child(2) { left: 40%; animation-delay: 0.5s; }
  .particle:nth-child(3) { left: 60%; animation-delay: 1s; }
  .particle:nth-child(4) { left: 80%; animation-delay: 1.5s; }
  .cinema-bar { position: absolute; width: 100%; height: 15%; background: #000; z-index: 10; border: 2px solid rgba(244, 163, 0, 0.3); }
  .cinema-bar.top { top: 0; border-bottom-width: 4px; }
  .cinema-bar.bottom { bottom: 0; border-top-width: 4px; }
  .spotlight { position: absolute; width: 100%; height: 100%; background: radial-gradient(ellipse at center, transparent 0%, transparent 30%, rgba(244, 163, 0, 0.1) 50%, rgba(0, 0, 0, 0.8) 100%); animation: spotlightPulse 3s ease-in-out infinite; }
  @keyframes spotlightPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
  .loading-text { position: absolute; bottom: 20%; left: 50%; transform: translateX(-50%); font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #f4a300, #ff8c00); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 3px; opacity: 0; animation: textFade 2s ease-in-out 1s forwards; }
  @keyframes textFade { 0%, 100% { opacity: 0; } 50% { opacity: 1; } }
`

export default function Startup() {
    const navigate = useNavigate()

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/login')
        }, 3500)
        return () => clearTimeout(timer)
    }, [navigate])

    return (
        <div className="startup-page">
            <style>{STARTUP_STYLES}</style>
            <div className="startup-container">
                <div className="cinema-bar top"></div>
                <div className="cinema-bar bottom"></div>
                <div className="film-strip left"></div>
                <div className="film-strip right"></div>
                <div className="spotlight"></div>

                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>
                <div className="particle"></div>

                <div className="logo-wrapper">
                    <img src="/static/logo.png" alt="ChitraStream" className="logo-image" />
                </div>

                <div className="loading-text">CHITRASTREAM</div>
            </div>
        </div>
    )
}
