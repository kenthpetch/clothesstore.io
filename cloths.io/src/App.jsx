import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'

const API_URL = 'https://fakestoreapi.com/products'
const StoreContext = createContext(null)

const FALLBACK_PRODUCTS = [
  {
    id: 101,
    title: 'Everyday Overshirt',
    price: 94,
    description: 'A clean, easy layer that works from morning errands to late-night plans.',
    category: "men's clothing",
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.8, count: 124 },
  },
  {
    id: 102,
    title: 'Modern Utility Jacket',
    price: 118,
    description: 'A light layer built for movement, with a sharp silhouette and all-day comfort.',
    category: "men's clothing",
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.7, count: 89 },
  },
  {
    id: 103,
    title: 'Softline Knit Set',
    price: 86,
    description: 'Easy texture, relaxed fit, and a fresh neutral palette for everyday wear.',
    category: "women's clothing",
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.9, count: 164 },
  },
  {
    id: 104,
    title: 'The Wander Coat',
    price: 135,
    description: 'A polished outer layer for city days, travel days, and everything in between.',
    category: "women's clothing",
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.6, count: 76 },
  },
  {
    id: 105,
    title: 'Weekend Cotton Tee',
    price: 42,
    description: 'Soft, breathable, and easy to style for the days you want to keep it simple.',
    category: "men's clothing",
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.5, count: 142 },
  },
  {
    id: 106,
    title: 'City Pleat Skirt',
    price: 68,
    description: 'A flattering silhouette with movement, polish, and plenty of everyday versatility.',
    category: "women's clothing",
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    rating: { rate: 4.7, count: 98 },
  },
]

function normalizeProducts(data) {
  const items = Array.isArray(data) ? data : []

  return items
    .map((product) => {
      if (!product || typeof product !== 'object') return null

      const categoryValue = typeof product.category === 'string' ? product.category : ''
      const category = categoryValue.toLowerCase().includes("women")
        ? "women's clothing"
        : categoryValue.toLowerCase().includes("men")
          ? "men's clothing"
          : categoryValue

      const price = Number(product.price)
      const rating = product.rating && typeof product.rating === 'object' ? product.rating : {}

      return {
        id: Number(product.id),
        title: product.title || 'Untitled item',
        description: product.description || 'A great addition to your wardrobe.',
        category,
        image:
          product.image ||
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
        price: Number.isFinite(price) ? price : 0,
        rating: {
          rate: Number(rating.rate ?? 0),
          count: Number(rating.count ?? 0),
        },
      }
    })
    .filter(Boolean)
    .filter(
      (product) =>
        product &&
        ["men's clothing", "women's clothing"].includes(product.category),
    )
}

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('stylehub-favorites') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch (error) {
    console.error('Could not read saved favorites:', error)
    return []
  }
}

function StoreProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState(readFavorites)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`The product service returned ${response.status}.`)
        }
        const data = await response.json()
        const nextProducts = normalizeProducts(data)

        if (nextProducts.length > 0) {
          setProducts(nextProducts)
          setError('')
        } else {
          setProducts(normalizeProducts(FALLBACK_PRODUCTS))
          setError('')
        }
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setProducts(normalizeProducts(FALLBACK_PRODUCTS))
          setError('')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    loadProducts()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('stylehub-favorites', JSON.stringify(favorites))
    } catch (storageError) {
      console.error('Could not save favorites:', storageError)
    }
  }, [favorites])

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    )
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        loading,
        error,
        favorites,
        toggleFavorite,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

function useStore() {
  return useContext(StoreContext)
}

function Icon({ name, size = 20, filled = false }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'heart') {
    return (
      <svg {...common} fill={filled ? 'currentColor' : 'none'}>
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
      </svg>
    )
  }
  if (name === 'search') {
    return (
      <svg {...common}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </svg>
    )
  }
  if (name === 'arrow') {
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  )
}

function Header() {
  const { favorites } = useStore()

  return (
    <>
      <div className="announcement">
        A little something for your next look <span>—</span> free shipping over $100
      </div>
      <header className="site-header">
        <Link className="wordmark" to="/" aria-label="StyleHub home">
          style<span>hub</span><i>.</i>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/shop">Shop all</NavLink>
          <NavLink to="/story">Our story</NavLink>
        </nav>
        <div className="header-actions">
          <NavLink className="favorite-link" to="/favorites" aria-label={`Favorites, ${favorites.length} saved`}>
            <Icon name="heart" size={19} />
            <span className="header-label">Saved</span>
            {favorites.length > 0 && <span className="favorite-count">{favorites.length}</span>}
          </NavLink>
        </div>
      </header>
    </>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <Link className="wordmark footer-mark" to="/">style<span>hub</span><i>.</i></Link>
      <p>Good clothes. Better days. Made for wherever life takes you.</p>
      <div className="footer-links">
        <Link to="/shop">Shop all</Link>
        <Link to="/story">Our story</Link>
        <span className="footer-note">© {new Date().getFullYear()} StyleHub</span>
      </div>
    </footer>
  )
}

function PageIntro({ eyebrow, title, description }) {
  return (
    <div className="page-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {description && <p className="intro-copy">{description}</p>}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      <p>Finding your next favorite...</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="state-card" role="alert">
      <span className="state-sparkle">!</span>
      <h2>We couldn&apos;t load the collection</h2>
      <p>{message} Please check your connection and try again.</p>
      <button className="button button-dark" onClick={() => window.location.reload()}>
        Try again <Icon name="arrow" size={16} />
      </button>
    </div>
  )
}

function HeartButton({ product, className = '' }) {
  const { favorites, toggleFavorite } = useStore()
  const isFavorite = favorites.includes(product.id)
  return (
    <button
      className={`heart-button ${isFavorite ? 'is-favorite' : ''} ${className}`}
      onClick={() => toggleFavorite(product.id)}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
    >
      <Icon name="heart" size={18} filled={isFavorite} />
    </button>
  )
}

function ProductCard({ product, index = 0 }) {
  return (
    <article className="product-card" style={{ '--card-index': index }}>
      <Link className="product-image-wrap" to={`/product/${product.id}`}>
        <div className="product-photo">
          <img src={product.image} alt={product.title} loading="lazy" />
        </div>
        <span className="product-tag">
          {product.category === "women's clothing" ? 'For her' : 'For him'}
        </span>
      </Link>
      <HeartButton product={product} />
      <Link className="product-info" to={`/product/${product.id}`}>
        <p className="product-category">{product.category}</p>
        <h3>{product.title}</h3>
        <div className="product-meta">
          <span>${product.price.toFixed(2)}</span>
          <span className="product-rating">★ {product.rating?.rate ?? '—'}</span>
        </div>
      </Link>
    </article>
  )
}

function ProductGrid({ products }) {
  if (products.length === 0) {
    return (
      <div className="empty-results">
        <span className="empty-icon">✳</span>
        <h2>No pieces found just yet</h2>
        <p>Try a different search or category. Your next favorite is out there.</p>
      </div>
    )
  }

  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  )
}

function HomePage() {
  return (
    <>
      <main className="home-page">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-kicker"><span className="kicker-line" /> Dressed for real life</span>
            <h1>Wear what<br />feels <em>like you.</em></h1>
            <p>Easy pieces, good energy. Find the things you&apos;ll reach for again and again.</p>
            <Link className="button button-dark" to="/shop">Explore the collection <Icon name="arrow" size={17} /></Link>
            <div className="hero-footnote"><span>01</span> / A wardrobe, reimagined</div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85"
              alt="Friends exploring a clothing store together"
            />
            <div className="hero-sticker"><span>THE<br />GOOD<br />STUFF</span><i>✳</i></div>
            <div className="hero-image-caption"><span>STYLE, YOUR WAY</span><span>EST. WITH YOU</span></div>
          </div>
          <div className="hero-side-note">A LITTLE LESS ORDINARY <span>↘</span></div>
        </section>

        <section className="home-quick-links" aria-label="Explore StyleHub">
          <Link className="quick-link-card quick-shop-card" to="/shop">
            <span className="quick-link-kicker">Find your next favorite</span>
            <span className="quick-link-title">Shop the collection</span>
            <span className="quick-link-arrow"><Icon name="arrow" size={18} /></span>
          </Link>
          <Link className="quick-link-card quick-story-card" to="/story">
            <span className="quick-link-kicker">A little more about us</span>
            <span className="quick-link-title">Get to know StyleHub</span>
            <span className="quick-link-arrow"><Icon name="arrow" size={18} /></span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

function ShopPage() {
  const { products, loading, error } = useStore()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('featured')

  const shownProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = products.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesQuery =
        !normalizedQuery ||
        `${product.title} ${product.description} ${product.category}`
          .toLowerCase()
          .includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })

    if (sort === 'price-low') result.sort((a, b) => a.price - b.price)
    if (sort === 'price-high') result.sort((a, b) => b.price - a.price)
    if (sort === 'name') result.sort((a, b) => a.title.localeCompare(b.title))
    return result
  }, [products, category, query, sort])

  return (
    <>
      <main className="shop-page">
        <section className="collection-section">
          <div className="collection-heading">
            <div>
              <p className="eyebrow">A fresh perspective</p>
              <h2>Good things, <em>right now.</em></h2>
            </div>
            <p className="collection-aside">Thoughtful staples. Standout favorites.<br />All the pieces in between.</p>
          </div>

          <div className="shop-toolbar">
            <div className="category-tabs" role="group" aria-label="Filter by category">
              {[
                ['all', 'Everything'],
                ["women's clothing", 'For her'],
                ["men's clothing", 'For him'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={category === value ? 'active' : ''}
                  onClick={() => setCategory(value)}
                  aria-pressed={category === value}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="toolbar-right">
              <label className="search-field">
                <Icon name="search" size={18} />
                <input
                  type="search"
                  placeholder="Find your thing"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search clothes"
                />
              </label>
              <label className="sort-field">
                <span>Sort:</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort products">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name</option>
                </select>
                <Icon name="chevron" size={15} />
              </label>
            </div>
          </div>
          <div className="results-caption">
            <span>{shownProducts.length} {shownProducts.length === 1 ? 'piece' : 'pieces'} to love</span>
            <span>Made for your everyday</span>
          </div>

          {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : <ProductGrid products={shownProducts} />}
          {!loading && !error && (
            <div className="collection-end"><span>✳</span> That&apos;s the collection. Make it yours.</div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}

function StoryPage() {
  return (
    <>
      <main className="story-page">
        <section className="story-hero">
          <p className="eyebrow">A little more about us</p>
          <h1>Good style starts<br />with <em>feeling good.</em></h1>
          <p className="story-intro">
            StyleHub is here for the everyday moments, the big plans, and everything
            in between. Clothes should feel like you—comfortable, confident, and
            ready for whatever comes next.
          </p>
          <Link className="button button-dark" to="/shop">Find your favorites <Icon name="arrow" size={17} /></Link>
          <div className="story-hero-mark" aria-hidden="true">✳</div>
        </section>
        <section className="story-values">
          <article>
            <span>01</span>
            <h2>Wear it your way.</h2>
            <p>There are no rules here. Pick the pieces that make you feel most like yourself.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Make room for joy.</h2>
            <p>Getting dressed can be a small, lovely part of a day. We keep it easy and fun.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Good things, simply.</h2>
            <p>A thoughtfully picked collection, with the details and everyday essentials you love.</p>
          </article>
        </section>
        <section className="story-outro">
          <p className="eyebrow">Your closet, your rules</p>
          <h2>Style isn&apos;t about more.<br /><em>It&apos;s about you.</em></h2>
          <Link className="text-link" to="/shop">Explore the collection <Icon name="arrow" size={16} /></Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

function FavoritesPage() {
  const { products, favorites, loading, error } = useStore()
  const savedProducts = products.filter((product) => favorites.includes(product.id))

  return (
    <>
      <main className="interior-page">
        <PageIntro
          eyebrow="The keepers"
          title={<>Your kind of <em>thing.</em></>}
          description="All the pieces you loved enough to save, in one happy place."
        />
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : savedProducts.length ? (
          <ProductGrid products={savedProducts} />
        ) : (
          <div className="favorites-empty">
            <div className="empty-heart"><Icon name="heart" size={29} /></div>
            <p className="eyebrow">A blank canvas</p>
            <h2>Nothing saved. <em>Yet.</em></h2>
            <p>Tap the little heart on anything that feels like you. We&apos;ll keep it safe here.</p>
            <Link className="button button-dark" to="/">Explore the collection <Icon name="arrow" size={16} /></Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { products, loading, error, favorites, toggleFavorite } = useStore()
  const product = products.find((item) => item.id === Number(id))
  const isFavorite = product ? favorites.includes(product.id) : false

  if (loading) return <main className="interior-page"><LoadingState /></main>
  if (error) return <main className="interior-page"><ErrorState message={error} /></main>
  if (!product) {
    return (
      <main className="interior-page">
        <div className="state-card">
          <span className="state-sparkle">?</span>
          <h2>We can&apos;t find that piece</h2>
          <p>It may have wandered off. Let&apos;s get you back to the good stuff.</p>
          <Link className="button button-dark" to="/">Back to the collection <Icon name="arrow" size={16} /></Link>
        </div>
      </main>
    )
  }

  return (
    <>
      <main className="product-page">
        <button className="back-link" onClick={() => navigate(-1)}>← <span>Back to the collection</span></button>
        <div className="product-detail">
          <div className="detail-image">
            <img src={product.image} alt={product.title} />
            <span className="detail-stamp">GOOD<br />CHOICE <i>✳</i></span>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <div className="detail-rating"><span>★ {product.rating?.rate ?? '—'}</span> <span>({product.rating?.count ?? 0} happy reviews)</span></div>
            <p className="detail-price">${product.price.toFixed(2)}</p>
            <p className="detail-description">{product.description}</p>
            <div className="detail-divider" />
            <p className="detail-note"><span>✳</span> A feel-good find for your everyday rotation.</p>
            <div className="detail-actions">
              <button
                className={`heart-button detail-heart ${isFavorite ? 'is-favorite' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite}
              >
                <Icon name="heart" size={18} filled={isFavorite} />
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function NotFoundPage() {
  return (
    <main className="interior-page">
      <div className="state-card">
        <span className="state-sparkle">✳</span>
        <h2>Looks like you took a detour</h2>
        <p>This page isn&apos;t in our collection.</p>
        <Link className="button button-dark" to="/">Back to StyleHub <Icon name="arrow" size={16} /></Link>
      </div>
    </main>
  )
}

function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppLayout />
      </StoreProvider>
    </BrowserRouter>
  )
}

export default App
