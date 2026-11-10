import { createContext, useContext, useEffect, useId, useMemo, useState } from 'react'
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

const API_URL = 'https://fakestoreapi.com'
const StoreContext = createContext(null)

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('stylehub-favorites') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch (error) {
    console.error('Could not read saved favorites:', error)
    return []
  }
}

function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem('stylehub-cart') || '[]')
    return Array.isArray(saved)
      ? saved.filter(
          (item) =>
            item &&
            Number.isInteger(item.id) &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : []
  } catch (error) {
    console.error('Could not read the shopping bag:', error)
    return []
  }
}

function readLastOrder() {
  try {
    return JSON.parse(localStorage.getItem('stylehub-last-order') || 'null')
  } catch (error) {
    console.error('Could not read the last order:', error)
    return null
  }
}

function StoreProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorites, setFavorites] = useState(readFavorites)
  const [cart, setCart] = useState(readCart)
  const [lastOrder, setLastOrder] = useState(readLastOrder)

  useEffect(() => {
    const controller = new AbortController()

    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        })
        if (!response.ok) {
          throw new Error(`The product service returned ${response.status}.`)
        }
        const data = await response.json()
        setProducts(
          data.filter((product) =>
            ["men's clothing", "women's clothing"].includes(product.category),
          ),
        )
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Products could not be loaded.')
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

  useEffect(() => {
    try {
      localStorage.setItem('stylehub-cart', JSON.stringify(cart))
    } catch (storageError) {
      console.error('Could not save the shopping bag:', storageError)
    }
  }, [cart])

  useEffect(() => {
    try {
      if (lastOrder) {
        localStorage.setItem('stylehub-last-order', JSON.stringify(lastOrder))
      } else {
        localStorage.removeItem('stylehub-last-order')
      }
    } catch (storageError) {
      console.error('Could not save the latest order:', storageError)
    }
  }, [lastOrder])

  const toggleFavorite = (id) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    )
  }

  const addToCart = (id) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === id)
      return existing
        ? current.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...current, { id, quantity: 1 }]
    })
    setLastOrder(null)
  }

  const setCartQuantity = (id, quantity) => {
    setCart((current) =>
      quantity > 0
        ? current.map((item) => (item.id === id ? { ...item, quantity } : item))
        : current.filter((item) => item.id !== id),
    )
  }

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item.id !== id))
  }

  return (
    <StoreContext.Provider
      value={{
        products,
        loading,
        error,
        favorites,
        toggleFavorite,
        cart,
        addToCart,
        setCartQuantity,
        removeFromCart,
        clearCart: () => setCart([]),
        lastOrder,
        setLastOrder,
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
  if (name === 'bag') {
    return (
      <svg {...common}>
        <path d="M5 8h14l1 13H4L5 8Z" />
        <path d="M9 9V6a3 3 0 0 1 6 0v3" />
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
  const { favorites, cart } = useStore()
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

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
          <NavLink className="bag-link" to="/cart" aria-label={`Shopping bag, ${cartCount} items`}>
            <Icon name="bag" size={19} />
            <span className="header-label">Bag</span>
            {cartCount > 0 && <span className="favorite-count">{cartCount}</span>}
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
  const { addToCart } = useStore()

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
      <button
        className="product-add-button"
        onClick={() => addToCart(product.id)}
        aria-label={`Add ${product.title} to bag`}
      >
        <Icon name="bag" size={15} /> Add to bag
      </button>
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
  const { products, loading, error, favorites, toggleFavorite, addToCart } = useStore()
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
                className="button button-dark detail-button"
                onClick={() => addToCart(product.id)}
                aria-label={`Add ${product.title} to bag`}
              >
                <Icon name="bag" size={17} />
                Add to bag
              </button>
              <button
                className={`heart-button detail-heart ${isFavorite ? 'is-favorite' : ''}`}
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                aria-pressed={isFavorite}
              >
                <Icon name="heart" size={18} filled={isFavorite} />
              </button>
            </div>
            <p className="shipping-note"><Icon name="bag" size={17} /> Free shipping on orders over $100</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

function CartPage() {
  const orderId = useId()
  const {
    products,
    loading,
    error,
    cart,
    setCartQuantity,
    removeFromCart,
    clearCart,
    lastOrder,
    setLastOrder,
  } = useStore()
  const [paymentMethod, setPaymentMethod] = useState('gcash')
  const [orderError, setOrderError] = useState('')
  const cartProducts = cart
    .map((item) => ({
      ...item,
      product: products.find((product) => product.id === item.id),
    }))
    .filter((item) => item.product)
  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  )
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 8
  const total = subtotal + shipping

  function placeOrder(event) {
    event.preventDefault()
    setOrderError('')
    const formData = new FormData(event.currentTarget)
    const customer = {
      name: String(formData.get('name')).trim(),
      phone: String(formData.get('phone')).trim(),
      address: String(formData.get('address')).trim(),
    }

    if (!customer.name || !customer.phone || !customer.address) {
      setOrderError('Please complete your name, phone number, and delivery address.')
      return
    }

    const order = {
      number: `SH-${orderId.replace(/[^a-z0-9]/gi, '').toUpperCase().padStart(7, '0').slice(-7)}`,
      items: cartProducts.map(({ product, quantity }) => ({
        title: product.title,
        quantity,
        price: product.price,
      })),
      subtotal,
      shipping,
      total,
      paymentMethod,
    }

    setLastOrder(order)
    clearCart()
  }

  if (loading) return <main className="interior-page"><LoadingState /></main>
  if (error) return <main className="interior-page"><ErrorState message={error} /></main>

  if (lastOrder && cartProducts.length === 0) {
    const paymentLabel = {
      gcash: 'GCash',
      maya: 'Maya',
      cod: 'Cash on delivery',
    }[lastOrder.paymentMethod]

    return (
      <>
        <main className="interior-page">
          <div className="order-success">
            <span className="success-mark">✓</span>
            <p className="eyebrow">Order received</p>
            <h1>Thanks for shopping <em>with us.</em></h1>
            <p className="order-number">Order {lastOrder.number}</p>
            <div className="order-receipt">
              <div><span>Payment method</span><strong>{paymentLabel}</strong></div>
              <div><span>Items subtotal</span><strong>${lastOrder.subtotal.toFixed(2)}</strong></div>
              <div><span>Shipping</span><strong>{lastOrder.shipping === 0 ? 'Free' : `$${lastOrder.shipping.toFixed(2)}`}</strong></div>
              <div className="receipt-total"><span>Total</span><strong>${lastOrder.total.toFixed(2)}</strong></div>
            </div>
            <p className="demo-payment-note">
              {lastOrder.paymentMethod === 'cod'
                ? 'Please pay the total in cash when your order arrives.'
                : `Demo checkout: no ${paymentLabel} payment was processed. In a live store, you would complete payment in the ${paymentLabel} app.`}
            </p>
            <Link
              className="button button-dark"
              to="/"
              onClick={() => setLastOrder(null)}
            >
              Back to the collection <Icon name="arrow" size={16} />
            </Link>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <main className="interior-page cart-page">
        <PageIntro
          eyebrow="Almost yours"
          title={<>Your shopping <em>bag.</em></>}
          description="Check your picks, choose how you want to pay, and you're all set."
        />
        {cartProducts.length === 0 ? (
          <div className="favorites-empty">
            <div className="empty-heart"><Icon name="bag" size={28} /></div>
            <p className="eyebrow">Room for something good</p>
            <h2>Your bag is <em>empty.</em></h2>
            <p>Find something you love and add it to your bag. It&apos;ll be right here.</p>
            <Link className="button button-dark" to="/">Explore the collection <Icon name="arrow" size={16} /></Link>
          </div>
        ) : (
          <div className="checkout-layout">
            <section className="cart-items" aria-label="Items in your shopping bag">
              <div className="cart-section-heading">
                <h2>Your picks</h2>
                <span>{cartProducts.reduce((count, item) => count + item.quantity, 0)} items</span>
              </div>
              {cartProducts.map(({ product, quantity }) => (
                <article className="cart-item" key={product.id}>
                  <Link className="cart-item-image" to={`/product/${product.id}`}>
                    <img src={product.image} alt={product.title} />
                  </Link>
                  <div className="cart-item-info">
                    <p className="product-category">{product.category}</p>
                    <Link to={`/product/${product.id}`}><h3>{product.title}</h3></Link>
                    <span className="cart-item-price">${product.price.toFixed(2)}</span>
                    <div className="quantity-control" aria-label={`Quantity for ${product.title}`}>
                      <button
                        type="button"
                        onClick={() => setCartQuantity(product.id, quantity - 1)}
                        aria-label={`Decrease ${product.title} quantity`}
                      >−</button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setCartQuantity(product.id, quantity + 1)}
                        aria-label={`Increase ${product.title} quantity`}
                      >+</button>
                    </div>
                  </div>
                  <div className="cart-item-end">
                    <strong>${(product.price * quantity).toFixed(2)}</strong>
                    <button
                      type="button"
                      className="remove-item"
                      onClick={() => removeFromCart(product.id)}
                    >Remove</button>
                  </div>
                </article>
              ))}
              <Link className="continue-shopping" to="/">← Continue shopping</Link>
            </section>

            <form className="checkout-card" onSubmit={placeOrder}>
              <h2>Delivery &amp; payment</h2>
              <label className="checkout-label">
                Full name
                <input name="name" type="text" autoComplete="name" required />
              </label>
              <label className="checkout-label">
                Phone number
                <input name="phone" type="tel" autoComplete="tel" placeholder="09XX XXX XXXX" required />
              </label>
              <label className="checkout-label">
                Delivery address
                <textarea name="address" autoComplete="street-address" rows="2" required />
              </label>
              <fieldset className="payment-options">
                <legend>Choose a payment method</legend>
                <label className={`payment-option ${paymentMethod === 'gcash' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={paymentMethod === 'gcash'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="payment-brand gcash-brand">G</span>
                  <span><strong>GCash</strong><small>Pay with your GCash wallet</small></span>
                  <span className="payment-radio" />
                </label>
                <label className={`payment-option ${paymentMethod === 'maya' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="maya"
                    checked={paymentMethod === 'maya'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="payment-brand maya-brand">M</span>
                  <span><strong>Maya</strong><small>Pay with your Maya wallet</small></span>
                  <span className="payment-radio" />
                </label>
                <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(event) => setPaymentMethod(event.target.value)}
                  />
                  <span className="payment-brand cod-brand"><Icon name="bag" size={17} /></span>
                  <span><strong>Cash on delivery</strong><small>Pay in cash when it arrives</small></span>
                  <span className="payment-radio" />
                </label>
              </fieldset>
              <div className="order-totals">
                <div><span>Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
                <div><span>Shipping</span><strong>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</strong></div>
                <div className="receipt-total"><span>Total</span><strong>${total.toFixed(2)}</strong></div>
              </div>
              <p className="demo-payment-note">Demo checkout only. No real payment is collected.</p>
              {orderError && <p className="checkout-error" role="alert">{orderError}</p>}
              <button className="button button-dark checkout-submit" type="submit">
                Place order · ${total.toFixed(2)} <Icon name="arrow" size={16} />
              </button>
            </form>
          </div>
        )}
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
        <Route path="/cart" element={<CartPage />} />
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
