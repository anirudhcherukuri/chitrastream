import { useState, useEffect } from 'react'

const MODAL_STYLES = `
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.85);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(10px);
    padding: 40px;
    animation: fadeIn 0.3s ease-out;
  }
  .modal-content {
    background: #1a0a00;
    width: 100%;
    max-width: 900px;
    height: 90vh;
    border-radius: 12px;
    border: 2px solid rgba(244,163,0,0.3);
    overflow-y: auto;
    position: relative;
    box-shadow: 0 0 50px rgba(0,0,0,0.8);
    animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .modal-close {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0,0,0,0.5);
    color: #f4a300;
    border: 1px solid rgba(244,163,0,0.5);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-size: 24px;
    cursor: pointer;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.3s;
    backdrop-filter: blur(5px);
  }
  .modal-close:hover { background: #f4a300; color: #000; box-shadow: 0 0 15px rgba(244,163,0,0.5); }
  
  .modal-hero {
    position: relative;
    height: 450px;
    background-size: cover;
    background-position: center top;
  }
  .modal-hero-mask {
    position: absolute;
    inset: 0;
    background: linear-gradient(0deg, #1a0a00 0%, transparent 50%, rgba(0,0,0,0.6) 100%);
  }
  .modal-hero-content {
    position: absolute;
    bottom: 0;
    left: 0;
    padding: 40px;
    width: 100%;
  }
  .modal-title { font-size: 48px; font-weight: 900; margin-bottom: 15px; color: #fff; text-shadow: 0 4px 15px rgba(0,0,0,0.8); }
  .modal-meta { display: flex; gap: 15px; align-items: center; margin-bottom: 25px; font-weight: 600; font-size: 15px; }
  .netflix-match { color: #f4a300; font-weight: 800; background: rgba(244,163,0,0.15); padding: 4px 10px; border-radius: 4px; border: 1px solid rgba(244,163,0,0.3); }
  .modal-year { color: #fff; }
  .hd-badge { border: 1px solid rgba(244,163,0,0.4); padding: 0 5px; border-radius: 3px; font-size: 11px; color: #f4a300; }
  
  .modal-buttons { display: flex; gap: 15px; }
  .btn-play { background: linear-gradient(135deg, #f4a300, #ff8c00); color: #000; font-weight: 800; font-size: 18px; padding: 10px 30px; border-radius: 8px; display: flex; align-items: center; gap: 10px; border: none; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(244,163,0,0.4); text-transform: uppercase; letter-spacing: 1px; }
  .btn-play:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(244,163,0,0.6); }
  .btn-circle { width: 45px; height: 45px; border-radius: 50%; border: 2px solid rgba(244,163,0,0.5); background: rgba(0,0,0,0.5); color: #f4a300; font-size: 20px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: 0.3s; backdrop-filter: blur(5px); }
  .btn-circle:hover { border-color: #f4a300; background: #f4a300; color: #000; box-shadow: 0 0 15px rgba(244,163,0,0.4); }
  
  .modal-body { padding: 40px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
  .modal-overview { font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.9); margin-bottom: 30px; }
  .modal-info-col { font-size: 14px; color: rgba(255,255,255,0.6); line-height: 1.6; }
  .modal-info-col span { color: #fff; }
  
  .streams-container { margin-top: 30px; }
  .streams-title { font-size: 18px; margin-bottom: 15px; font-weight: 700; color: #f4a300; }
  .stream-card { background: rgba(244,163,0,0.05); border: 1px solid rgba(244,163,0,0.2); padding: 12px 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .stream-link { color: #000; text-decoration: none; background: #f4a300; padding: 6px 15px; border-radius: 4px; font-weight: 700; font-size: 13px; transition: 0.3s; }
  .stream-link:hover { background: #ff8c00; box-shadow: 0 0 10px rgba(244,163,0,0.4); }

  .netflix-tabs { display: flex; gap: 30px; border-bottom: 1px solid rgba(244,163,0,0.2); margin-top: 40px; }
  .n-tab { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 18px; font-weight: 700; padding-bottom: 15px; cursor: pointer; position: relative; transition: 0.3s; }
  .n-tab.active { color: #f4a300; }
  .n-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 3px; background: #f4a300; box-shadow: 0 0 10px rgba(244,163,0,0.5); }
  
  /* Scrollbar for modal */
  .modal-content::-webkit-scrollbar { width: 8px; }
  .modal-content::-webkit-scrollbar-track { background: transparent; }
  .modal-content::-webkit-scrollbar-thumb { background: rgba(244,163,0,0.3); border-radius: 4px; }
  .modal-content::-webkit-scrollbar-thumb:hover { background: rgba(244,163,0,0.6); }
  
  @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
`

export default function MovieModal({ movieId, onClose, user }) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inWatchlist, setInWatchlist] = useState(false)
  const [activeTab, setActiveTab] = useState('more')

  const fetchMovie = async () => {
    try {
      const r = await fetch(`/api/movies/${movieId}`, { credentials: 'include' })
      const data = await r.json()
      setMovie(data)
      setInWatchlist(data.in_watchlist)
      setLoading(false)
    } catch (err) {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovie()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = 'auto' }
  }, [movieId])

  const handleWatchlist = async () => {
    try {
      const r = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId }),
        credentials: 'include'
      })
      const res = await r.json()
      if (res.success) {
        setInWatchlist(res.action === 'added')
      }
    } catch (err) { console.error(err) }
  }

  if (loading) return (
    <div className="modal-overlay">
      <style>{MODAL_STYLES}</style>
      <div className="modal-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ color: '#f4a300', fontSize: '24px', fontWeight: 'bold' }}>Loading...</div>
      </div>
    </div>
  )
  if (!movie) return null

  // Helper for high-res background
  let bgUrl = movie.poster || movie.PosterURL
  if (bgUrl && (bgUrl.includes('amazon.com'))) {
    bgUrl = bgUrl.split('@._V1_')[0] + '@._V1_.jpg'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style>{MODAL_STYLES}</style>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-hero" style={{ backgroundImage: `url('${bgUrl}')` }}>
          <div className="modal-hero-mask"></div>
          <div className="modal-hero-content">
            <h1 className="modal-title">{movie.title || movie.Title}</h1>
            <div className="modal-meta">
              <span className="netflix-match">{movie.worth_score || (80 + ((movie.id || movie.MovieID || 0) % 20))}% Top Rated</span>
              <span className="modal-year">{movie.year || movie.Year}</span>
              <span className="hd-badge">HD</span>
              <span>{movie.runtime || movie.Runtime} min</span>
            </div>
            <div className="modal-buttons">
              <button className="btn-play" onClick={() => setActiveTab('trailers')}>ℹ Where to Watch</button>
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-left">
            <p className="modal-overview">{movie.plot || movie.Plot}</p>

            <div className="netflix-tabs">
              <button className={`n-tab ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}>More Like This</button>
              <button className={`n-tab ${activeTab === 'trailers' ? 'active' : ''}`} onClick={() => setActiveTab('trailers')}>Watch Options</button>
            </div>

            <div style={{ padding: '20px 0' }}>
              {activeTab === 'more' && (
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {movie.recommendations?.map((m, i) => {
                    let recUrl = m.PosterURL || ''
                    if (recUrl.includes('amazon.com')) recUrl = recUrl.split('@._V1_')[0] + '@._V1_.jpg'

                    return (
                      <div key={i} style={{ width: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(244,163,0,0.1)' }}>
                        <img src={recUrl} alt={m.Title} style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
                        <div style={{ padding: '10px', fontSize: '14px', fontWeight: '600', color: '#fff' }}>{m.Title}</div>
                      </div>
                    )
                  })}
                </div>
              )}
              {activeTab === 'trailers' && (
                <div>
                  <h3 style={{ marginBottom: '15px', color: '#f4a300' }}>Available on out partner platforms:</h3>
                  {movie.platforms?.map((plat, i) => (
                    <div key={i} className="stream-card">
                      <div>
                        <strong style={{ color: '#fff' }}>{plat.name}</strong> <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginLeft: '10px' }}>{plat.price}</span>
                      </div>
                      <a href={plat.url} target="_blank" rel="noreferrer" className="stream-link">Watch</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-right">
            <div className="modal-info-col" style={{ marginBottom: '15px' }}>
              Cast: <span>{movie.cast || movie.Cast}</span>
            </div>
            <div className="modal-info-col" style={{ marginBottom: '15px' }}>
              Genres: <span>{movie.genre || movie.Genre}</span>
            </div>
            <div className="modal-info-col">
              Director: <span>{movie.director || movie.Director}</span>
            </div>
          </div>
        </div >

      </div >
    </div >
  )
}
