import { useState, useRef, useEffect } from 'react'

const STYLES = `
  .ai-fab {
    position: fixed;
    bottom: 30px;
    right: 30px;
    width: 65px;
    height: 65px;
    border-radius: 50%;
    background: linear-gradient(135deg, #f4a300 0%, #ff8c00 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30px;
    cursor: pointer;
    box-shadow: 0 10px 40px rgba(244, 163, 0, 0.4);
    z-index: 1000;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
  .ai-fab:hover {
    transform: scale(1.1) rotate(15deg);
    box-shadow: 0 15px 50px rgba(244, 163, 0, 0.6);
  }
  .ai-window {
    position: fixed;
    bottom: 110px;
    right: 30px;
    width: 400px;
    height: 600px;
    background: rgba(15, 15, 15, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 25px;
    border: 1px solid rgba(244, 163, 0, 0.3);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 1000;
    box-shadow: 0 25px 100px rgba(0, 0, 0, 0.8);
    animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(50px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .ai-header {
    background: linear-gradient(90deg, rgba(244, 163, 0, 0.1) 0%, transparent 100%);
    padding: 25px;
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid rgba(244, 163, 0, 0.1);
  }
  .ai-avatar {
    width: 45px;
    height: 45px;
    background: linear-gradient(135deg, #f4a300 0%, #ff8c00 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 5px 15px rgba(244, 163, 0, 0.3);
  }
  .ai-title {
    flex: 1;
  }
  .ai-title h4 {
    color: #fff;
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }
  .ai-title p {
    color: #f4a300;
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .ai-close {
    cursor: pointer;
    font-size: 24px;
    color: rgba(255, 255, 255, 0.3);
    transition: color 0.3s;
  }
  .ai-close:hover { color: #f4a300; }
  
  .ai-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    scrollbar-width: thin;
    scrollbar-color: rgba(244, 163, 0, 0.2) transparent;
  }
  .ai-msg {
    max-width: 85%;
    padding: 15px 20px;
    border-radius: 18px;
    font-size: 15px;
    line-height: 1.6;
    animation: msgFade 0.3s ease;
  }
  @keyframes msgFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  
  .ai-msg.bot {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    align-self: flex-start;
    border-bottom-left-radius: 5px;
    border: 1px solid rgba(244, 163, 0, 0.1);
  }
  .ai-msg.user {
    background: linear-gradient(135deg, #f4a300 0%, #ff8c00 100%);
    color: #000;
    align-self: flex-end;
    border-bottom-right-radius: 5px;
    font-weight: 600;
    box-shadow: 0 5px 15px rgba(244, 163, 0, 0.2);
  }
  
  .ai-input-box {
    padding: 20px;
    border-top: 1px solid rgba(244, 163, 0, 0.1);
  }
  .ai-input-wrapper {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 15px;
    padding: 5px 10px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid rgba(244, 163, 0, 0.1);
    transition: all 0.3s;
  }
  .ai-input-wrapper:focus-within {
    border-color: #f4a300;
    background: rgba(255, 255, 255, 0.08);
  }
  .ai-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    padding: 12px;
    font-size: 15px;
    outline: none;
  }
  .ai-send {
    width: 45px;
    height: 45px;
    background: #f4a300;
    border: none;
    border-radius: 12px;
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 20px;
  }
  .ai-send:hover { transform: scale(1.05); background: #ff8c00; }
  
  .dot-flashing {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #f4a300;
    color: #f4a300;
    animation: dotFlashing 1s infinite linear alternate;
    animation-delay: .5s;
    margin: 5px 15px;
  }
  .dot-flashing::before, .dot-flashing::after {
    content: '';
    display: inline-block;
    position: absolute;
    top: 0;
  }
  .dot-flashing::before {
    left: -15px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #f4a300;
    color: #f4a300;
    animation: dotFlashing 1s infinite linear alternate;
    animation-delay: 0s;
  }
  .dot-flashing::after {
    left: 15px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #f4a300;
    color: #f4a300;
    animation: dotFlashing 1s infinite linear alternate;
    animation-delay: 1s;
  }
  @keyframes dotFlashing {
    0% { background-color: #f4a300; }
    50%, 100% { background-color: rgba(244, 163, 0, 0.2); }
  }
`

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Namaste! I am your AI Cinema Assistant. Need help with production, budget estimates, or finding the perfect filming location?' }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsTyping(true)

    try {
      const res = await fetch('/api/production-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plot: userMsg })
      })
      const data = await res.json()

      let botResponse = ""
      if (data.success) {
        const budget = data.estimated_budget || data.budget || "Details coming soon..."
        const location = data.filing_locations || data.locations || "Exploring locations..."
        const strategy = data.production_strategy || data.strategy || "Consulting experts..."

        botResponse = `🎬 **ChatGPT Production Analysis:**\n\n💰 **Estimated Budget:** ${budget}\n\n📍 **Recommended Locations:** ${location}\n\n📝 **Expert Strategy:** ${strategy}`
      } else {
        botResponse = "I couldn't analyze that movie plot. Try giving me more details about the story!"
      }

      setMessages(prev => [...prev, { role: 'bot', text: botResponse }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I am having trouble connecting to my creative circuits right now. 🎬' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="ai-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c-.11.66-.28 1.5-.5 2.1a12 12 0 0 1-4.7 4.7 12 12 0 0 1-3.6 1L4 12c-1.1 0-2 .9-2 2s.9 2 2 2 2 .9 2 2-.9 2-2 2 .9 2 2 2c1.1 0 2-.9 2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2 .9 2 2 2a2 2 0 0 1 2 2c-.66.11-1.5.28-2.1.5a12 12 0 0 1-4.7 4.7z" /></svg>}
      </div>

      {isOpen && (
        <div className="ai-window">
          <div className="ai-header">
            <div className="ai-avatar"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c-.11.66-.28 1.5-.5 2.1a12 12 0 0 1-4.7 4.7 12 12 0 0 1-3.6 1L4 12c-1.1 0-2 .9-2 2s.9 2 2 2 2 .9 2 2-.9 2-2 2 .9 2 2 2c1.1 0 2-.9 2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2 .9 2 2 2a2 2 0 0 1 2 2c-.66.11-1.5.28-2.1.5a12 12 0 0 1-4.7 4.7z" /></svg></div>
            <div className="ai-title">
              <h4>Cinema AI</h4>
              <p>Online • Production Expert</p>
            </div>
            <div className="ai-close" onClick={() => setIsOpen(false)}>✕</div>
          </div>

          <div className="ai-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role}`}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
            {isTyping && (
              <div className="ai-msg bot">
                <div className="dot-flashing"></div>
              </div>
            )}
          </div>

          <div className="ai-input-box">
            <div className="ai-input-wrapper">
              <input
                className="ai-input"
                placeholder="Describe your movie plot..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button className="ai-send" onClick={handleSend}>➤</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
