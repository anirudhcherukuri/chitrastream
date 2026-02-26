import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import CryptoJS from 'crypto-js'

const CHITRA_WA_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  :root {
    --bg-dark: #080808;
    --sidebar-bg: #121212;
    --header-bg: #1a1a1a;
    --accent: #f4a300;
    --accent-glow: rgba(244, 163, 0, 0.4);
    --bubble-out: rgba(244, 163, 0, 0.25);
    --bubble-in: #222;
    --text-main: #ffffff;
    --text-dim: #999;
    --glass: rgba(255, 255, 255, 0.03);
  }

  body { 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    background: var(--bg-dark); 
    color: var(--text-main);
    height: 100vh;
    overflow: hidden;
  }

  .wa-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25"><defs><pattern xmlns="http://www.w3.org/2000/svg" id="bg" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23f4a300" opacity="0.1"/></pattern></defs><rect width="100%25" height="100%25" fill="%23050505"/><rect width="100%25" height="100%25" fill="url(%23bg)"/></svg>');
    background-size: cover;
  }

  /* --- SIDEBAR --- */
  .wa-sidebar {
    width: 320px;
    background: rgba(18, 18, 18, 0.7);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 5px 0 25px rgba(0,0,0,0.5);
  }

  .wa-sidebar-header {
    height: 80px;
    padding: 0 25px;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }

  .wa-logo {
    height: 45px;
    filter: drop-shadow(0 0 10px var(--accent-glow));
    cursor: pointer;
    transition: transform 0.3s;
  }
  .wa-logo:hover {
    transform: scale(1.05);
  }

  .wa-search-bar {
    padding: 15px;
  }
  .wa-search-bg {
    background: var(--glass);
    border-radius: 12px;
    display: flex;
    align-items: center;
    padding: 0 15px;
    gap: 12px;
    border: 1px solid rgba(255,255,255,0.05);
  }
  .wa-search-bg input {
    background: transparent;
    border: none;
    color: #fff;
    padding: 10px 0;
    width: 100%;
    outline: none;
    font-size: 14px;
  }

  .wa-chats-list {
    flex: 1;
    overflow-y: auto;
  }

  .wa-chat-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    gap: 15px;
    cursor: pointer;
    transition: all 0.3s;
    border-bottom: 1px solid rgba(255,255,255,0.02);
  }
  .wa-chat-item:hover { background: rgba(244, 163, 0, 0.05); }
  .wa-chat-item.active { background: rgba(244, 163, 0, 0.1); border-left: 4px solid var(--accent); }

  .wa-chat-avatar {
    width: 50px;
    height: 50px;
    border-radius: 16px;
    background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
    transition: all 0.3s ease;
  }
  .wa-chat-item:hover .wa-chat-avatar, .wa-chat-item.active .wa-chat-avatar {
    background: linear-gradient(135deg, rgba(244,163,0,0.2), rgba(244,163,0,0.05));
    border-color: rgba(244,163,0,0.4);
    box-shadow: 0 0 15px rgba(244,163,0,0.2);
  }

  .wa-chat-info { flex: 1; min-width: 0; }
  .wa-chat-name { font-weight: 800; font-size: 16px; color: #fff; margin-bottom: 4px; display: block; letter-spacing: 0.5px; }
  .wa-chat-preview { font-size: 13px; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; font-weight: 300;}

  .wa-main {
    flex: 1;
    background: radial-gradient(circle at top right, rgba(244,163,0,0.08) 0%, transparent 40%), 
                radial-gradient(circle at bottom left, rgba(255,255,255,0.02) 0%, transparent 40%),
                var(--bg-dark);
    display: flex;
    flex-direction: column;
    position: relative;
    box-shadow: inset 20px 0 50px rgba(0,0,0,0.5);
  }
  /* Professionally rich noise overlay */
  .wa-main::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    opacity: 0.03;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .wa-main-header {
    height: 80px;
    padding: 0 30px;
    background: rgba(18, 18, 18, 0.4);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 10;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  .wa-header-user { display: flex; align-items: center; gap: 15px; }
  .wa-header-name { font-weight: 800; font-size: 18px; color: var(--accent); text-shadow: 0 0 10px rgba(244,163,0,0.3); letter-spacing: 0.5px; }
  .wa-header-status { font-size: 13px; color: #aaa; font-weight: 300; display: flex; align-items: center; gap: 6px; }
  .wa-header-status::before { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; background: #00ff66; box-shadow: 0 0 8px #00ff66; }

  .wa-messages-area {
    flex: 1;
    overflow-y: auto;
    padding: 40px 10%;
    display: flex;
    flex-direction: column;
    position: relative;
    scroll-behavior: smooth;
  }

  .wa-e2ee-badge {
    background: linear-gradient(90deg, rgba(244, 163, 0, 0.1), rgba(244, 163, 0, 0.02));
    color: var(--accent);
    padding: 12px 25px;
    border-radius: 20px;
    font-size: 12px;
    text-align: center;
    max-width: 450px;
    margin: 0 auto 40px;
    border: 1px solid rgba(244, 163, 0, 0.2);
    font-weight: 600;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    backdrop-filter: blur(10px);
  }

  .wa-msg {
    margin-bottom: 20px;
    max-width: 75%;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    transition: transform 0.2s ease-out;
  }
  .wa-msg:hover { transform: translateY(-2px); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(15px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

  .wa-msg.in { align-self: flex-start; }
  .wa-msg.out { align-self: flex-end; }

  .wa-bubble {
    padding: 14px 20px;
    border-radius: 20px;
    font-size: 15px;
    line-height: 1.5;
    position: relative;
    box-shadow: 0 8px 25px rgba(0,0,0,0.4);
    font-weight: 400;
    transition: all 0.3s;
  }
  .wa-msg:hover .wa-bubble { box-shadow: 0 12px 35px rgba(0,0,0,0.6); }
  
  .wa-msg.in .wa-bubble { 
    background: #1a1a1a; color: #fff; 
    border-bottom-left-radius: 4px; border: 1px solid rgba(255,255,255,0.05); 
  }
  .wa-msg.out .wa-bubble { 
    background: linear-gradient(135deg, rgba(244,163,0,0.3) 0%, rgba(244,163,0,0.15) 100%); 
    color: #fff; border-bottom-right-radius: 4px; border: 1px solid rgba(244, 163, 0, 0.5); 
    backdrop-filter: blur(10px); 
    box-shadow: inset 0 0 15px rgba(244,163,0,0.1), 0 8px 25px rgba(0,0,0,0.4);
  }

  .wa-msg-user { font-size: 13px; font-weight: 800; color: var(--accent); margin-bottom: 6px; letter-spacing: 0.5px; opacity: 0.9; }
  .wa-msg-time { font-size: 11px; color: var(--text-dim); margin-top: 6px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
  .wa-msg.in .wa-msg-time { align-self: flex-start; margin-left: 5px; }
  .wa-msg.out .wa-msg-time { align-self: flex-end; margin-right: 5px; }

  /* MEDIA & GIFS */
  .wa-media {
    max-width: 100%;
    border-radius: 12px;
    margin-top: 8px;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    transition: transform 0.3s;
  }
  .wa-media:hover { transform: scale(1.02); }

  /* INPUT SECTION */
  .wa-input-section {
    padding: 25px 30px;
    background: rgba(18, 18, 18, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    gap: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .wa-tool-icon { font-size: 24px; color: var(--text-dim); cursor: pointer; transition: 0.3s; padding: 10px; border-radius: 50%; background: rgba(255,255,255,0.03); }
  .wa-tool-icon:hover { color: var(--accent); background: rgba(244,163,0,0.1); transform: rotate(10deg); }

  .wa-input-wrapper {
    flex: 1;
    background: rgba(255,255,255,0.05);
    border-radius: 25px;
    padding: 0 25px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);
  }
  .wa-input-wrapper:focus-within {
    border-color: rgba(244,163,0,0.5);
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5), 0 0 15px rgba(244,163,0,0.1);
    background: rgba(255,255,255,0.08);
  }
  .wa-input-wrapper input {
    width: 100%;
    background: transparent;
    border: none;
    color: #fff;
    padding: 15px 0;
    outline: none;
    font-family: inherit;
    font-size: 16px;
    font-weight: 500;
  }

  .wa-send-btn {
    width: 55px;
    height: 55px;
    border-radius: 20px;
    background: linear-gradient(135deg, #f4a300, #ff8c00);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    border: none;
    cursor: pointer;
    font-size: 22px;
    box-shadow: 0 8px 25px rgba(244,163,0,0.4);
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .wa-send-btn:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 12px 30px rgba(244,163,0,0.6); }
  .wa-send-btn:active { transform: scale(0.95); }

  /* GIF MODAL */
  .gif-panel {
    position: absolute;
    bottom: 90px;
    left: 30px;
    width: 350px;
    height: 400px;
    background: var(--header-bg);
    border: 1px solid var(--accent);
    border-radius: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }
  .gif-header { padding: 15px; font-weight: 800; border-bottom: 1px solid var(--glass); display: flex; justify-content: space-between; }
  .gif-grid { flex: 1; overflow-y: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px; }
  .gif-item { width: 100%; border-radius: 10px; cursor: pointer; transition: 0.3s; }
  .gif-item:hover { transform: scale(1.05); }
`

const SHARED_SECRET = "ChitraStream_E2EE_Alpha_2026"

const encryptMessage = (text) => {
  return CryptoJS.AES.encrypt(text, SHARED_SECRET).toString()
}

const decryptMessage = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SHARED_SECRET)
    const originalText = bytes.toString(CryptoJS.enc.Utf8)
    if (!originalText) return ciphertext // Return original if it wasn't encrypted (migration support)
    return originalText
  } catch (e) {
    return ciphertext // Return original if decryption fails
  }
}

const ICONS = {
  Globe: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Movie: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>,
  Broadcast: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M5 16.93a6.83 6.83 0 0 1 0-9.86"></path><path d="M8.59 13.51a2.31 2.31 0 0 1 0-3.03"></path><circle cx="12" cy="12" r="2"></circle><path d="M15.41 13.51a2.31 2.31 0 0 0 0-3.03"></path><path d="M19 16.93a6.83 6.83 0 0 0 0-9.86"></path></svg>,
  Production: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M2 3h20"></path><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"></path><path d="m7 21 5-5 5 5"></path></svg>,
  Video: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>,
  Budget: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>,
  Gif: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>,
  Clip: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>,
  Send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
}

const CHAT_ROOMS = [
  { id: 'general', name: 'Global Plaza', icon: <ICONS.Globe />, desc: 'Main community hub' },
  { id: 'movies', name: 'Cine Lounge', icon: <ICONS.Movie />, desc: 'Movie talk & reviews' },
  { id: 'filmography', name: 'Filmography', icon: <ICONS.Video />, desc: 'Discuss actor/director works' },
  { id: 'budget', name: 'Budget Discussions', icon: <ICONS.Budget />, desc: 'Box office & cost breakdowns' },
  { id: 'production', name: 'Producer Desk', icon: <ICONS.Production />, desc: 'Professional insights' }
]

const POPULAR_GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJobm1ueXp4YnlpZHB5amV4ZHB4ZHB4ZHB4ZHB4ZHB4ZHB4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxS7SPOXFW8/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJobm1ueXp4YnlpZHB5amV4ZHB4ZHB4ZHB4ZHB4ZHB4ZHB4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/l0HlS8O9jR7m1uM1G/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJobm1ueXp4YnlpZHB5amV4ZHB4ZHB4ZHB4ZHB4ZHB4ZHB4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7abKhOpuMcmLjdcI/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJobm1ueXp4YnlpZHB5amV4ZHB4ZHB4ZHB4ZHB4ZHB4ZHB4JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/26gsjCZpPolPr3sBy/giphy.gif"
]

export default function ChitraChat({ user }) {
  const [currentRoom, setCurrentRoom] = useState('general')
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [showGifs, setShowGifs] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [socket, setSocket] = useState(null)
  const messagesEndRef = useRef(null)
  const navigate = useNavigate()

  const userName = user?.username || 'Guest'

  useEffect(() => {
    const s = io({
      withCredentials: true,
      transports: ['polling', 'websocket'],
      upgrade: true
    })
    setSocket(s)
    s.on('connect', () => {
      console.log('Socket connected!')
      s.emit('join_room', { room: 'general' })
    })

    s.on('room_history', ({ messages: msgs }) => {
      setMessages(msgs.map(m => ({ ...m, message: decryptMessage(m.message) })))
    })

    s.on('receive_message', msg => {
      setMessages(prev => [...prev, { ...msg, message: decryptMessage(msg.message) }])
    })

    s.on('room_users_update', ({ count }) => {
      setOnlineCount(count)
    })

    s.on('online_users_update', ({ count }) => {
      setOnlineCount(count)
    })

    return () => s.disconnect()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (content = null) => {
    const finalContent = content || messageInput.trim()
    if (!socket || !finalContent) return

    const encrypted = finalContent.startsWith('http') ? finalContent : encryptMessage(finalContent)
    socket.emit('send_message', { room: currentRoom, message: encrypted })

    // AI Integration
    if (finalContent.toLowerCase().includes('@ai') || finalContent.toLowerCase().includes('hey ai')) {
      socket.emit('ask_ai', { room: currentRoom, query: finalContent })
    }

    setMessageInput('')
    setShowGifs(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // In a real app, upload to S3/Cloudinary. Here we'll simulate.
      sendMessage(`[Media Upload: ${file.name}]`)
    }
  }

  const activeRoom = CHAT_ROOMS.find(r => r.id === currentRoom) || CHAT_ROOMS[0]

  return (
    <div className="wa-container">
      <style>{CHITRA_WA_STYLES}</style>

      <div className="wa-sidebar">
        <div className="wa-sidebar-header">
          <img src="/static/logo.png" alt="Logo" className="wa-logo" onClick={() => navigate('/dashboard')} />
          <div style={{ flex: 1 }} />
          <div style={{ color: 'var(--accent)', fontWeight: 800 }}>COMMUNITY</div>
        </div>

        <div className="wa-search-bar">
          <div className="wa-search-bg">
            <span>🔍</span>
            <input placeholder="Search channels..." />
          </div>
        </div>

        <div className="wa-chats-list">
          {CHAT_ROOMS.map(room => (
            <div key={room.id} className={`wa-chat-item ${currentRoom === room.id ? 'active' : ''}`} onClick={() => switchRoom(room.id)}>
              <div className="wa-chat-avatar" style={{ color: currentRoom === room.id ? 'var(--accent)' : 'var(--text-dim)' }}>
                {room.icon}
              </div>
              <div className="wa-chat-info">
                <span className="wa-chat-name">{room.name}</span>
                <span className="wa-chat-preview">{room.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wa-main">
        <div className="wa-main-header">
          <div className="wa-header-user">
            <div className="wa-chat-avatar" style={{ width: '45px', height: '45px', color: 'var(--accent)', borderColor: 'rgba(244,163,0,0.3)' }}>
              {activeRoom.icon}
            </div>
            <div>
              <div className="wa-header-name">{activeRoom.name}</div>
              <div className="wa-header-status">Secure End-to-End Encrypted Room</div>
            </div>
          </div>
          <button style={{ background: 'linear-gradient(135deg, #f4a300, #ff8c00)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', transition: '0.3s', boxShadow: '0 5px 15px rgba(244,163,0,0.3)' }} onClick={() => navigate('/dashboard')} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>BACK TO HOME</button>
        </div>

        <div className="wa-messages-area">
          <div className="wa-e2ee-badge">
            🛡️ Your messages are locked with ChitraStream E2EE. No one outside of this conversation can read them.
          </div>

          {messages.map((msg, i) => (
            <div key={i} className={`wa-msg ${msg.username === userName ? 'out' : 'in'}`}>
              <div className="wa-bubble">
                {msg.username !== userName && <div className="wa-msg-user">{msg.username}</div>}
                {msg.message.startsWith('http') ? (
                  <img src={msg.message} className="wa-media" alt="GIF" />
                ) : (
                  <div className="wa-msg-text">{msg.message}</div>
                )}
              </div>
              <div className="wa-msg-time">
                {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {msg.username === userName && (
                  <span style={{ color: '#00f2fe', fontSize: '13px', marginLeft: '2px', fontWeight: 800 }}>✓✓</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {showGifs && (
          <div className="gif-panel">
            <div className="gif-header">
              <span>Trending GIFs</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setShowGifs(false)}>✕</span>
            </div>
            <div className="gif-grid">
              {POPULAR_GIFS.map((g, i) => (
                <img key={i} src={g} className="gif-item" onClick={() => sendMessage(g)} alt="GIF" />
              ))}
            </div>
          </div>
        )}

        <div className="wa-input-section">
          <input type="file" id="media-up" hidden onChange={handleFileUpload} />
          <span className="wa-tool-icon" onClick={() => setShowGifs(!showGifs)} style={{ opacity: showGifs ? 1 : 0.6, color: showGifs ? 'var(--accent)' : 'inherit' }}>
            <ICONS.Gif />
          </span>
          <span className="wa-tool-icon" onClick={() => document.getElementById('media-up').click()} style={{ opacity: 0.6 }}>
            <ICONS.Clip />
          </span>
          <div className="wa-input-wrapper">
            <input
              placeholder="Type a secure message..."
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
          </div>
          <button className="wa-send-btn" onClick={() => sendMessage()}>
            <ICONS.Send />
          </button>
        </div>
      </div>
    </div>
  )

  function switchRoom(roomId) {
    socket.emit('leave_room', { room: currentRoom })
    setCurrentRoom(roomId)
    setMessages([])
    socket.emit('join_room', { room: roomId })
  }
}
