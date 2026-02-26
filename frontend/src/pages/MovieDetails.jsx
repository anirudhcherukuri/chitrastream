import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AIAssistant from '../components/AIAssistant'

const MOVIE_DETAILS_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #000000 0%, #1a0a00 50%, #000000 100%); color: #fff; min-height: 100vh; }
  .navbar { background: rgba(0, 0, 0, 0.95); padding: 20px 50px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid rgba(244, 163, 0, 0.3); }
  .logo { height: 40px; filter: drop-shadow(0 0 10px rgba(244, 163, 0, 0.5)); cursor: pointer; }
  .nav-links { display: flex; gap: 30px; align-items: center; }
  .nav-links a { color: rgba(255, 255, 255, 0.8); text-decoration: none; font-weight: 600; font-size: 14px; transition: color 0.3s; }
  .nav-links a:hover { color: #f4a300; }
  .user-profile { width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #f4a300, #ff8c00); display: flex; align-items: center; justify-content: center; font-weight: 700; cursor: pointer; color: #000; text-decoration: none; }
  
  .back-btn-container { max-width: 1200px; margin: 0 auto; padding: 30px 50px 0; display: flex; justify-content: space-between; }
  .back-btn { display: inline-block; padding: 12px 25px; background: rgba(255, 255, 255, 0.05); border: 2px solid rgba(244, 163, 0, 0.3); border-radius: 10px; color: rgba(255, 255, 255, 0.8); text-decoration: none; font-weight: 600; transition: all 0.3s; }
  .back-btn:hover { background: rgba(244, 163, 0, 0.15); border-color: #f4a300; color: #f4a300; }
  
  .movie-header { display: grid; grid-template-columns: 350px 1fr; gap: 50px; max-width: 1200px; margin: 30px auto 50px; padding: 0 50px; }
  .poster-section { position: relative; }
  .movie-poster { width: 100%; border-radius: 20px; box-shadow: 0 20px 80px rgba(0,0,0,0.8); border: 3px solid rgba(244, 163, 0, 0.3); }
  
  .action-buttons { display: flex; gap: 15px; margin-bottom: 30px; }
  .btn { padding: 12px 25px; border-radius: 10px; font-weight: 700; cursor: pointer; border: none; transition: 0.3s; display: flex; align-items: center; gap: 8px; font-size: 15px; }
  .btn-primary { background: #f4a300; color: #000; }
  .btn-primary:hover { background: #ffbc33; transform: scale(1.05); }
  .btn-secondary { background: rgba(255,255,255,0.05); color: #fff; border: 1px solid rgba(244, 163, 0, 0.3); }
  .btn-secondary:hover { background: rgba(255,255,255,0.15); border-color: #f4a300; }
  .btn-secondary.active { background: #f4a300; color: #000; border-color: #f4a300; }

  .worth-score-container { margin-bottom: 30px; display: flex; align-items: center; gap: 20px; background: linear-gradient(90deg, rgba(244, 163, 0, 0.1) 0%, transparent 100%); padding: 15px 25px; border-radius: 15px; border-left: 5px solid #f4a300; }
  .worth-label { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
  .worth-value { font-size: 36px; font-weight: 900; color: #f4a300; text-shadow: 0 0 20px rgba(244, 163, 0, 0.4); }
  
  .rating-badge { position: absolute; top: 20px; right: 20px; background: linear-gradient(135deg, #f4a300, #ff8c00); padding: 10px 18px; border-radius: 12px; text-align: center; color: #000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .score { display: block; font-size: 24px; font-weight: 900; }

  .movie-details-title { background: linear-gradient(135deg, #fff 0%, #aaa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 56px; font-weight: 900; margin-bottom: 10px; }
  .movie-meta { display: flex; gap: 25px; margin-bottom: 25px; color: rgba(255,255,255,0.6); font-size: 14px; }
  .meta-item strong { color: #f4a300; }

  .platforms-section { margin-bottom: 40px; }
  .platforms-section h3 { color: #f4a300; font-size: 18px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
  .platforms-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px; }
  .platform-card { background: rgba(255,255,255,0.05); padding: 15px 20px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(244,163,0,0.1); transition: 0.3s; }
  .platform-card:hover { border-color: #f4a300; background: rgba(244,163,0,0.05); }
  .plat-name { font-weight: 700; font-size: 16px; }
  .plat-price { font-size: 12px; color: rgba(255,255,255,0.5); }
  .watch-link { color: #f4a300; text-decoration: none; font-weight: 800; font-size: 13px; padding: 6px 15px; border: 1.5px solid #f4a300; border-radius: 20px; transition: 0.3s; }
  .watch-link:hover { background: #f4a300; color: #000; }

  .section { margin-bottom: 35px; }
  .section h3 { color: #f4a300; font-size: 20px; margin-bottom: 12px; font-weight: 700; }
  .section p { color: rgba(255, 255, 255, 0.8); line-height: 1.8; font-size: 16px; }

  .interactive-grid { max-width: 1200px; margin: 0 auto 100px; padding: 0 50px; }
  .tabs-header { display: flex; gap: 40px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 30px; }
  .tab-btn { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 20px; font-weight: 800; cursor: pointer; padding-bottom: 15px; transition: 0.3s; position: relative; }
  .tab-btn.active { color: #f4a300; }
  .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: #f4a300; box-shadow: 0 0 10px #f4a300; }

  .comment-input-box { background: rgba(255,255,255,0.05); padding: 25px; border-radius: 20px; margin-bottom: 30px; border: 1px solid rgba(244,163,0,0.2); }
  .comment-input-box textarea { width: 100%; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px; color: #fff; font-family: inherit; font-size: 15px; margin-bottom: 15px; resize: none; }
  .comment-input-box textarea:focus { border-color: #f4a300; outline: none; }

  .review-item { background: rgba(255,255,255,0.03); padding: 20px; border-radius: 15px; margin-bottom: 15px; border-left: 4px solid #f4a300; }
  .review-user { font-weight: 800; color: #f4a300; margin-bottom: 5px; display: flex; justify-content: space-between; }
  .review-text { color: rgba(255,255,255,0.8); line-height: 1.6; }

  .rec-row { margin-top: 50px; }
  .rec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 20px; margin-top: 20px; }
  .rec-card { border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.3s; position: relative; aspect-ratio: 2/3; border: 1px solid rgba(255,255,255,0.1); }
  .rec-card:hover { transform: translateY(-10px); border-color: #f4a300; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .rec-card img { width: 100%; height: 100%; object-fit: cover; }
  .rec-info { position: absolute; inset: 0; background: linear-gradient(transparent, rgba(0,0,0,0.9)); display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; opacity: 0; transition: 0.3s; }
  .rec-card:hover .rec-info { opacity: 1; }
  .rec-title { font-weight: 800; font-size: 14px; }

  @media (max-width: 768px) {
    .movie-header { grid-template-columns: 1fr; padding: 0 20px; }
    .movie-details-title { font-size: 32px; }
    .interactive-grid { padding: 0 20px; }
  }
`

export default function MovieDetails({ user }) {
    const { id } = useParams()
    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('discussion')
    const [opinion, setOpinion] = useState('')
    const [ratingInput, setRatingInput] = useState(5)
    const [inWatchlist, setInWatchlist] = useState(false)
    const navigate = useNavigate()

    const handleImageError = (e) => {
        e.target.src = 'https://via.placeholder.com/300x450/111/f4a300?text=ChitraStream'
    }

    const upscalePoster = (url) => {
        if (!url) return ''
        if (url.includes('ia.media-amazon.com') || url.includes('m.media-amazon.com')) {
            if (url.includes('@._V1_')) {
                return url.split('@._V1_')[0] + '@._V1_.jpg'
            }
            return url.replace(/UX\d+/, 'UX600').replace(/SX\d+/, 'SX600').replace(/UY\d+/, 'UY900').replace(/SY\d+/, 'SY900')
        }
        return url
    }

    const fetchMovie = async () => {
        try {
            const r = await fetch(`/api/movies/${id}`, { credentials: 'include' })
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
    }, [id])

    const handleWatchlist = async () => {
        try {
            const r = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ movie_id: id }),
                credentials: 'include'
            })
            const res = await r.json()
            if (res.success) {
                setInWatchlist(res.action === 'added')
            }
        } catch (err) {
            console.error(err)
        }
    }

    const handlePostComment = async () => {
        if (!opinion.trim()) return
        const endpoint = activeTab === 'reviews' ? `/api/movies/${id}/reviews` : `/api/movies/${id}/discussions`
        const body = activeTab === 'reviews'
            ? { rating: ratingInput, review_text: opinion }
            : { comment: opinion }

        try {
            const r = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include'
            })
            if (r.ok) {
                setOpinion('')
                fetchMovie() // Refresh data
            }
        } catch (err) {
            console.error(err)
        }
    }

    if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Loading...</div>
    if (!movie) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '100px' }}>Movie not found</div>

    return (
        <>
            <style>{MOVIE_DETAILS_STYLES}</style>
            <nav className="navbar">
                <img src="/static/logo.png" alt="ChitraStream" className="logo" onClick={() => navigate('/dashboard')} />
                <div className="nav-links">
                    <Link to="/dashboard">Home</Link>
                    <Link to="/community">Community</Link>
                    <Link to="/profile" className="user-profile">{user?.username?.[0] || 'U'}</Link>
                </div>
            </nav>

            <div className="back-btn-container">
                <Link to="/dashboard" className="back-btn">← Browse Gallery</Link>
                <button className={`btn btn-secondary ${inWatchlist ? 'active' : ''}`} onClick={handleWatchlist}>
                    {inWatchlist ? '✓ In Watchlist' : '+ Save to Watchlist'}
                </button>
            </div>

            <div className="movie-header">
                <div className="poster-section">
                    <img src={upscalePoster(movie.poster || movie.PosterURL)} alt={movie.title} className="movie-poster" onError={handleImageError} />
                    <div className="rating-badge">
                        <span className="score">{movie.rating || movie.Rating}</span>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800 }}>IMDb</span>
                    </div>
                </div>

                <div className="info-section">
                    <h1 className="movie-details-title">{movie.title || movie.Title}</h1>

                    <div className="movie-meta">
                        <span className="meta-item"><strong>{movie.year || movie.Year}</strong></span>
                        <span className="meta-item"><strong>{movie.runtime || movie.Runtime}</strong> min</span>
                        <span className="meta-item">Genre: <strong>{movie.genre || movie.Genre}</strong></span>
                    </div>

                    <div className="worth-score-container">
                        <div>
                            <div className="worth-label">Is it worth watching?</div>
                            <div className="worth-value">{movie.worth_score}%</div>
                        </div>
                        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${movie.worth_score}%`, height: '100%', background: '#f4a300', boxShadow: '0 0 10px #f4a300' }}></div>
                        </div>
                    </div>

                    {movie.platforms && movie.platforms.length > 0 && (
                        <div className="platforms-section">
                            <h3>📺 Available Direct Links</h3>
                            <div className="platforms-list">
                                {movie.platforms.map((plat, i) => (
                                    <div key={i} className="platform-card">
                                        <div className="platform-info">
                                            <div className="plat-name">{plat.name}</div>
                                            <div className="plat-price">{plat.price || 'Subscription'}</div>
                                        </div>
                                        <a href={plat.url} target="_blank" rel="noreferrer" className="watch-link">Watch Now</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="section">
                        <h3>Plot Summary</h3>
                        <p>{movie.plot || movie.Plot}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                        <div className="section">
                            <h3>Director</h3>
                            <p>{movie.director || movie.Director}</p>
                        </div>
                        <div className="section">
                            <h3>Cast</h3>
                            <p>{movie.cast || movie.Cast}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="interactive-grid">
                <div className="tabs-header">
                    <button className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>Theories & Discussion</button>
                    <button className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>User Reviews</button>
                    <button className={`tab-btn ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}>More Like This</button>
                </div>

                {activeTab !== 'more' && (
                    <div className="comment-input-box">
                        <h4>{activeTab === 'reviews' ? 'Rate this movie' : 'Share your theory or thoughts'}</h4>
                        {activeTab === 'reviews' && (
                            <div style={{ margin: '15px 0', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input type="range" min="1" max="10" step="0.5" value={ratingInput} onChange={e => setRatingInput(e.target.value)} />
                                <span style={{ fontWeight: 800, color: '#f4a300' }}>{ratingInput} / 10</span>
                            </div>
                        )}
                        <textarea
                            placeholder={activeTab === 'reviews' ? "Write your review..." : "What's on your mind about this movie?"}
                            rows="3"
                            value={opinion}
                            onChange={e => setOpinion(e.target.value)}
                        ></textarea>
                        <button className="btn btn-primary" onClick={handlePostComment}>Post {activeTab === 'reviews' ? 'Review' : 'Comment'}</button>
                    </div>
                )}

                <div className="tab-content">
                    {activeTab === 'discussion' && (
                        <div className="discussions-list">
                            {movie.discussions?.length > 0 ? movie.discussions.map((d, i) => (
                                <div key={i} className="review-item" style={{ borderLeftColor: 'rgba(255,255,255,0.2)' }}>
                                    <div className="review-user">
                                        <span>{d.UserName}</span>
                                        <span style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(d.CreatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="review-text">{d.Comment}</div>
                                </div>
                            )) : <p style={{ opacity: 0.5 }}>No discussions yet. Start one!</p>}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-list">
                            {movie.reviews?.length > 0 ? movie.reviews.map((r, i) => (
                                <div key={i} className="review-item">
                                    <div className="review-user">
                                        <span>{r.UserName}</span>
                                        <span style={{ fontWeight: 800 }}>⭐ {r.Rating}/10</span>
                                    </div>
                                    <div className="review-text">{r.ReviewText}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.4, marginTop: '10px' }}>{new Date(r.CreatedAt).toLocaleDateString()}</div>
                                </div>
                            )) : <p style={{ opacity: 0.5 }}>Be the first to review this movie!</p>}
                        </div>
                    )}

                    {activeTab === 'more' && (
                        <div className="rec-row">
                            <div className="rec-grid">
                                {movie.recommendations?.map((m, i) => (
                                    <div key={i} className="rec-card" onClick={() => navigate(`/movie/${m.MovieID}`)}>
                                        <img src={upscalePoster(m.PosterURL)} alt={m.Title} onError={handleImageError} />
                                        <div className="rec-info">
                                            <div className="rec-title">{m.Title}</div>
                                            <div style={{ fontSize: '11px', color: '#f4a300' }}>⭐ {m.Rating}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AIAssistant />
        </>
    )
}
