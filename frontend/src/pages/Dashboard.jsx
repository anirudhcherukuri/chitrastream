import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AIAssistant from '../components/AIAssistant'
import MovieModal from '../components/MovieModal'

const handleImageError = (e) => {
  e.target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%231a1a1a" /><text x="50%" y="50%" fill="%23f4a300" font-family="sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle">ChitraStream</text></svg>`
}

const generatePlaceholder = (title) => {
  const safeTitle = encodeURIComponent((title || 'ChitraStream').substring(0, 20))
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="450" viewBox="0 0 300 450"><rect width="300" height="450" fill="%231a1a1a" /><text x="50%" y="50%" fill="%23f4a300" font-family="sans-serif" font-size="26" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${safeTitle}</text></svg>`
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

const DASHBOARD_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Poppins', sans-serif; background: #141414; color: #fff; overflow-x: hidden; }
  
  .navbar { position: fixed; top: 0; width: 100%; z-index: 1000; background: transparent; transition: background 0.3s ease; }
  .navbar.scrolled { background: #141414; }
  .nav-content { max-width: 100%; padding: 20px 60px; display: flex; justify-content: space-between; align-items: center; }
  .nav-left { display: flex; align-items: center; gap: 40px; }
  .brand-logo { height: 60px; pointer-events: auto; }
  .nav-menu { display: flex; gap: 25px; align-items: center; }
  .nav-link { color: #e5e5e5; text-decoration: none; font-weight: 500; font-size: 15px; transition: color 0.3s; }
  .nav-link:hover, .nav-link.active { color: #f4a300; font-weight: 600; }
  
  .nav-right { display: flex; align-items: center; gap: 20px; pointer-events: auto; }
  
  .nav-right-search { display: flex; align-items: center; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 40px; backdrop-filter: blur(15px); padding: 5px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); overflow: hidden; height: 44px; transform-origin: right; transform: scale(1); }
  .nav-right-search.collapsed { width: 44px; padding: 0; justify-content: center; cursor: pointer; border-color: rgba(244,163,0,0.3); background: rgba(244,163,0,0.05); }
  .nav-right-search.collapsed:hover { transform: scale(1.1); background: rgba(244,163,0,0.1); border-color: #f4a300; }
  .nav-right-search:focus-within { border-color: rgba(244,163,0,0.5); box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(244,163,0,0.2); background: rgba(0, 0, 0, 0.6); }
  
  .search-input-area { display: flex; align-items: center; padding: 0 15px 0 20px; border-right: 1px solid rgba(255,255,255,0.1); height: 100%; transition: all 0.3s; }
  .nav-right-search.collapsed .search-input-area { padding: 0; border: none; justify-content: center; width: 100%; }
  .search-icon-modern { display: flex; align-items: center; justify-content: center; color: #f4a300; margin-right: 10px; transition: margin 0.3s; }
  .nav-right-search.collapsed .search-icon-modern { margin: 0; }
  .nav-right-search input { background: transparent; border: none; color: #fff; width: 220px; font-size: 15px; outline: none; padding: 8px 0; font-weight: 500;}
  .nav-right-search input::placeholder { color: rgba(255,255,255,0.5); font-weight: 400; }
  .nav-right-search.collapsed input { display: none; }
  
  .search-filters-area { display: flex; align-items: center; padding: 0 10px; gap: 5px; }
  .modern-filter-select {
    background: transparent;
    border: 1px solid transparent;
    color: #e5e5e5;
    padding: 8px 35px 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    outline: none;
    cursor: pointer;
    transition: all 0.3s;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 14px;
  }
  .modern-filter-select:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: rgba(255,255,255,0.1); }
  .modern-filter-select:focus { color: #f4a300; background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23f4a300' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e"); }
  .modern-filter-select option { background: #1a1a1a; color: #fff; font-size: 15px; padding: 10px; }
  

  .user-badge { display: flex; align-items: center; gap: 15px; }
  .user-avatar { width: 32px; height: 32px; background: linear-gradient(135deg, #f4a300, #ff8c00); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.3s; color: #000; }
  .user-avatar:hover { transform: scale(1.05); }
  .logout-btn { background: transparent; padding: 6px 16px; border: 1px solid rgba(255,255,255,0.5); border-radius: 4px; text-decoration: none; color: white; font-weight: 500; font-size: 13px; transition: all 0.3s; cursor: pointer; }
  .logout-btn:hover { background: rgba(255,255,255,0.1); border-color: #fff; }

  .hero { position: relative; height: 85vh; display: flex; align-items: center; margin-bottom: 20px; overflow: hidden; background: #000; }
  .hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; opacity: 0.8; filter: blur(3px) brightness(0.6); transform: scale(1.05); }
  .hero-mask { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(20,20,20,1) 0%, rgba(20,20,20,0.85) 45%, transparent 100%); }
  .hero-gradient-bottom { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 60%, rgba(20,20,20,0.8) 90%, #141414 100%); pointer-events: none;}
  .hero-content { position: relative; z-index: 10; padding: 0 60px; max-width: 700px; animation: fadeIn 1s ease-out; margin-top: 60px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  
  .hero-title { font-size: 64px; font-weight: 900; margin-bottom: 20px; line-height: 1.1; color: #fff; text-shadow: 2px 2px 10px rgba(0,0,0,0.8); }
  .hero-meta { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; }
  .hero-rating { background: #f4a300; color: #000; padding: 5px 12px; border-radius: 4px; font-weight: 700; font-size: 15px; }
  .hero-year { color: #e5e5e5; font-size: 17px; font-weight: 500; }
  .hero-overview { font-size: 18px; line-height: 1.7; color: #e5e5e5; margin-bottom: 30px; text-shadow: 1px 1px 5px rgba(0,0,0,0.8); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .hero-buttons { display: flex; gap: 15px; }
  .btn-hero { padding: 14px 35px; border: none; border-radius: 4px; font-size: 18px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: all 0.3s; }
  .btn-play { background: #fff; color: #000; }
  .btn-play:hover { background: rgba(255,255,255,0.85); transform: scale(1.05); }
  .btn-info { background: rgba(109,109,110,0.7); color: #fff; }
  .btn-info:hover { background: rgba(109,109,110,0.5); }

  .content-wrapper { position: relative; z-index: 20; padding: 0 60px 60px; margin-top: -80px; }
  .row-section { margin-bottom: 50px; }
  .row-header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
  .row-title { font-size: 24px; font-weight: 600; color: #e5e5e5; }
  .view-all { color: #f4a300; font-size: 14px; text-decoration: none; transition: color 0.3s; cursor: pointer; }
  .view-all:hover { color: #ff8c00; }

  .row-container { position: relative; margin: 0 -10px; }
  .movie-row { display: flex; gap: 12px; overflow-x: auto; overflow-y: hidden; scroll-behavior: smooth; padding: 5px 10px 15px; scrollbar-width: none; }
  .movie-row::-webkit-scrollbar { display: none; }
  
  .movie-card { width: 180px; min-width: 180px; flex: 0 0 180px; aspect-ratio: 2/3; position: relative; cursor: pointer; transition: all 0.3s ease; }
  .movie-card:hover { transform: scale(1.1); z-index: 10; }
  .movie-card-img { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; background: #2a2a2a; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: 0.3s; }
  .movie-card:hover .movie-card-img { box-shadow: 0 8px 30px rgba(244,163,0,0.5); }
  
  .movie-card-rating { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.85); padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; backdrop-filter: blur(10px); color: #f4a300; }
  .movie-card-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.95) 85%); opacity: 0; transition: opacity 0.3s; display: flex; flex-direction: column; justify-content: flex-end; padding: 15px; border-radius: 6px; }
  .movie-card:hover .movie-card-overlay { opacity: 1; }
  .movie-card-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; color: #fff; line-height: 1.3; }
  .movie-card-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #e5e5e5; }
  .movie-card-year { color: #999; }

  .scroll-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.7); border: none; color: #fff; width: 50px; height: 100%; cursor: pointer; z-index: 10; font-size: 28px; transition: all 0.3s; opacity: 0; }
  .row-container:hover .scroll-arrow { opacity: 1; }
  .scroll-arrow:hover { background: rgba(0,0,0,0.9); }
  .arrow-left { left: 0; border-radius: 0 4px 4px 0; }
  .arrow-right { right: 0; border-radius: 4px 0 0 4px; }
  
  @media (max-width: 1024px) {
    .nav-content { padding: 15px 30px; } .hero { height: 70vh; } .hero-content { padding: 0 30px; } .hero-title { font-size: 48px; } .content-wrapper { padding: 0 30px 40px; }
    .movie-card { min-width: 160px; }
  }
  @media (max-width: 768px) {
    .nav-menu, .search-box { display: none; }
    .nav-content { padding: 15px 20px; } .hero { height: 60vh; } .hero-content { padding: 0 20px; } .hero-title { font-size: 36px; } 
    .hero-overview { font-size: 15px; -webkit-line-clamp: 3; }
    .btn-hero { padding: 10px 20px; font-size: 14px; }
    .content-wrapper { padding: 0 20px 30px; } .row-title { font-size: 20px; } .movie-card { min-width: 130px; } .scroll-arrow { display: none; }
  }
`

function MovieRow({ title, movies, onMovieClick }) {
  const listRef = useRef()
  if (!movies || movies.length === 0) return null

  const scroll = (offset) => {
    listRef.current.scrollLeft += offset
  }

  const rowId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className="row-section" id={rowId}>
      <div className="row-header">
        <h2 className="row-title">{title}</h2>
        <span className="view-all">Explore All</span>
      </div>
      <div className="row-container">
        <button className="scroll-arrow arrow-left" onClick={() => scroll(-800)}>‹</button>
        <div className="movie-row" ref={listRef}>
          {movies.map((m, i) => {
            let bgUrl = m.poster || m.PosterURL || ''
            if (!bgUrl || bgUrl.includes('dummyimage.com') || bgUrl.includes('placehold') || bgUrl.includes('placeholder')) {
              bgUrl = generatePlaceholder(m.title || m.Title)
            } else if (bgUrl.includes('amazon.com')) {
              bgUrl = bgUrl.split('@._V1_')[0] + '@._V1_.jpg'
            }

            return (
              <div key={m.id || i} className="movie-card" onClick={() => onMovieClick(m.id || m.MovieID)}>
                <img className="movie-card-img" src={bgUrl} alt={m.title || m.Title} loading="lazy" onError={handleImageError} />
                <div className="movie-card-rating">⭐ {m.worth_score || (80 + ((m.id || m.MovieID || i) % 20))}% Top Rated</div>
                <div className="movie-card-overlay">
                  <div className="movie-card-title">{m.title || m.Title}</div>
                  <div className="movie-card-meta">
                    <span className="movie-card-year">{m.year || m.Year}</span>
                    <span>HD</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <button className="scroll-arrow arrow-right" onClick={() => scroll(800)}>›</button>
      </div>
    </div>
  )
}

export default function Dashboard({ user, setUser }) {
  const [allMovies, setAllMovies] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(true)
  const [hero, setHero] = useState(null)
  const [search, setSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [filters, setFilters] = useState({ rating: 0, genre: 'All', year: 'All' })
  const [showNotifs, setShowNotifs] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let heroInterval = null;
    const fetchData = async () => {
      try {
        const [moviesRes, watchlistRes, trendingRes] = await Promise.all([
          fetch('/api/movies', { credentials: 'include' }),
          fetch('/api/watchlist', { credentials: 'include' }),
          fetch('/api/movies/trending', { credentials: 'include' })
        ])

        const moviesData = await moviesRes.json()
        const watchlistData = await watchlistRes.json()
        const trendingData = await trendingRes.json()

        const uniqueByTitle = Array.from(new Set(moviesData.map(m => (m.title || m.Title))))
          .map(title => moviesData.find(m => (m.title || m.Title) === title))

        const uniqueTrending = Array.from(new Set(trendingData.map(m => (m.title || m.Title))))
          .map(title => trendingData.find(m => (m.title || m.Title) === title))

        const uniqueWatchlist = Array.from(new Set(watchlistData.map(m => (m.title || m.Title))))
          .map(title => watchlistData.find(m => (m.title || m.Title) === title))

        setAllMovies(uniqueByTitle)
        setWatchlist(uniqueWatchlist)
        setTrending(uniqueTrending)

        if (uniqueByTitle.length > 0) {
          const top = uniqueByTitle.filter(m => parseFloat(m.rating || m.Rating) >= 8.5)
          const validHeroes = top.length > 0 ? top : uniqueByTitle
          setHero(validHeroes[Math.floor(Math.random() * Math.min(5, validHeroes.length))])

          heroInterval = setInterval(() => {
            setHero(validHeroes[Math.floor(Math.random() * Math.min(20, validHeroes.length))]);
          }, 30000);
        }
      } catch (err) {
        console.error("Fetch dashboard data error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (heroInterval) clearInterval(heroInterval)
    }
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    navigate('/login')
  }

  const allGenres = ['All', ...new Set(allMovies.flatMap(m => (m.genre || m.Genre || '').split(',').map(g => g.trim())))].sort()

  const filteredMovies = allMovies.filter(m => {
    const title = (m.title || m.Title || '').toLowerCase()
    const genre = (m.genre || m.Genre || '').toLowerCase()
    const rating = parseFloat(m.rating || m.Rating || 0)
    const yearYear = parseInt(m.year || m.Year || 0)

    const searchTerms = search.toLowerCase().split(' ')
    const matchesSearch = !search || searchTerms.every(term =>
      title.includes(term) || genre.includes(term) || yearYear.toString().includes(term)
    )

    const matchesGenre = filters.genre === 'All' || genre.includes(filters.genre.toLowerCase())
    const matchesRating = rating >= filters.rating
    const matchesYear = filters.year === 'All'
      || (filters.year === '2020+' && yearYear >= 2020)
      || (filters.year === '2010s' && yearYear >= 2010 && yearYear < 2020)
      || (filters.year === 'Pre-2010' && yearYear < 2010)

    return matchesSearch && matchesGenre && matchesRating && matchesYear
  })

  // Grouping rows properly
  const isActivelyFiltering = search.length >= 2 || filters.genre !== 'All' || filters.rating > 0 || filters.year !== 'All'

  const trendingMovies = trending.length > 0 ? trending : allMovies.slice(0, 10);
  const criticallyAcclaimed = [...allMovies]
    .filter(m => !trendingMovies.find(t => (t.id || t.MovieID) === (m.id || m.MovieID)))
    .sort((a, b) => (b.rating || b.Rating) - (a.rating || a.Rating))
    .slice(0, 15);

  const movieRows = [
    { title: 'Trending Now', movies: trendingMovies },
    { title: 'Critically Acclaimed', movies: criticallyAcclaimed },
    { title: 'Action & Adventure', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('action')).slice(0, 15) },
    { title: 'Comedies', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('comedy')).slice(0, 15) },
    { title: 'Sci-Fi & Fantasy', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().match(/sci-fi|fantasy/)).slice(0, 15) },
    { title: 'Thrillers', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('thriller')).slice(0, 15) },
    { title: 'Dramas', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('drama')).slice(0, 15) },
    { title: 'Romance', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('romance')).slice(0, 15) },
    { title: 'Horror', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('horror')).slice(0, 15) },
    { title: 'Documentaries', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('documentary')).slice(0, 15) },
    { title: 'Animation', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('animation')).slice(0, 15) },
    { title: 'Family', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('family')).slice(0, 15) },
    { title: 'Crime Studios', movies: allMovies.filter(m => (m.genre || m.Genre || '').toLowerCase().includes('crime')).slice(0, 15) },
  ]

  let heroBgUrl = hero ? (hero.poster || hero.PosterURL) : ''
  if (!heroBgUrl || heroBgUrl.includes('dummyimage.com') || heroBgUrl.includes('placehold') || heroBgUrl.includes('placeholder')) {
    heroBgUrl = generatePlaceholder(hero ? (hero.title || hero.Title) : 'ChitraStream')
  } else if (heroBgUrl.includes('amazon.com')) {
    heroBgUrl = heroBgUrl.split('@._V1_')[0] + '@._V1_.jpg'
  }

  return (
    <>
      <style>{DASHBOARD_STYLES}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-content">
          <div className="nav-left">
            <img src="/static/logo.png" className="brand-logo" alt="ChitraStream" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <div className="nav-menu">
              <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Home</span>
              <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => document.getElementById('critically-acclaimed')?.scrollIntoView({ behavior: 'smooth' })}>Movies</span>
              <span className="nav-link" style={{ cursor: 'pointer' }} onClick={() => navigate('/community')}>Community Chat</span>
            </div>
          </div>
          <div className="nav-right">
            {isSearchOpen ? (
              <div className="nav-right-search">
                <div className="search-input-area" style={{ borderRight: 'none', paddingRight: '10px' }}>
                  <span className="search-icon-modern">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4a300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                  <input
                    autoFocus
                    placeholder="Titles, genres, years..."
                    value={search}
                    style={{ width: '300px' }}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <button
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '24px', cursor: 'pointer', padding: '0 5px', marginLeft: '5px', transition: 'color 0.3s' }}
                    onMouseOver={(e) => e.target.style.color = '#f4a300'}
                    onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.5)'}
                    onClick={() => { setIsSearchOpen(false); setSearch(''); setFilters({ rating: 0, genre: 'All', year: 'All' }); }}
                  >×</button>
                </div>
              </div>
            ) : (
              <div className="nav-right-search collapsed" onClick={() => setIsSearchOpen(true)}>
                <div className="search-input-area">
                  <span className="search-icon-modern">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f4a300" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  </span>
                </div>
              </div>
            )}
            <div className="user-badge" onClick={() => navigate('/profile')}>
              <span style={{ color: '#e5e5e5', fontSize: '14px', cursor: 'pointer', fontWeight: 500 }}>Hello, {user?.username}</span>
              <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </nav>



      {!loading && hero && (
        <section className="hero">
          <img className="hero-bg" src={heroBgUrl} alt="Featured" onError={handleImageError} />
          <div className="hero-mask"></div>
          <div className="hero-gradient-bottom"></div>
          <div className="hero-content">
            <h1 className="hero-title">{hero.title || hero.Title}</h1>
            <div className="hero-meta">
              <span className="hero-rating">{hero.worth_score || (80 + ((hero.id || hero.MovieID || 0) % 20))}% Top Rated</span>
              <span className="hero-year">{hero.year || hero.Year}</span>
              <span className="hero-runtime">{hero.runtime || hero.Runtime} min</span>
            </div>
            <p className="hero-overview">{hero.plot || hero.Plot}</p>
            <div className="hero-buttons">
              <button className="btn-hero btn-play" onClick={() => setSelectedMovieId(hero.id || hero.MovieID)}>ⓘ More Info / Where to Watch</button>
            </div>
          </div>
        </section>
      )}

      <div className="content-wrapper">


        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: '#e50914' }}>Loading...</div>
        ) : isActivelyFiltering ? (
          <MovieRow title={search ? `Search: ${search}` : "Filtered Results"} movies={filteredMovies} onMovieClick={setSelectedMovieId} />
        ) : (
          movieRows.map((row, i) => (
            <MovieRow key={i} title={row.title} movies={row.movies} onMovieClick={setSelectedMovieId} />
          ))
        )}
      </div>

      <AIAssistant />

      {selectedMovieId && (
        <MovieModal movieId={selectedMovieId} onClose={() => setSelectedMovieId(null)} user={user} />
      )}
    </>
  )
}
