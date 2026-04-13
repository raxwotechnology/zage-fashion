import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, MapPin, Menu, X, ChevronDown } from 'lucide-react';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { searchProducts } from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.getCount());
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    if (user) fetchCart();
  }, [user]);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);

  // Handle search with debounce
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);

    if (value.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await searchProducts(value);
        setSearchResults(res.data.products.slice(0, 6));
        setShowSearchResults(true);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  // Close search results on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="base-container py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold text-primary-green flex-shrink-0">
          FreshCart
        </Link>

        {/* Search Bar (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-xl" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search for fresh groceries..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full border border-card-border rounded-full py-2.5 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent transition-all text-sm"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-primary-green text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-600 transition-colors"
            >
              <Search size={16} />
            </button>

            {/* Search Dropdown Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white border border-card-border rounded-xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((product) => (
                  <Link
                    key={product._id}
                    to={`/product/${product._id}`}
                    onClick={() => { setShowSearchResults(false); setSearchQuery(''); }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-card-border last:border-b-0"
                  >
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/50'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-navy m-0 truncate">{product.name}</p>
                      <p className="text-xs text-muted-text m-0">{product.storeId?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-primary-green flex-shrink-0">${product.price.toFixed(2)}</span>
                  </Link>
                ))}
                <button
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2.5 text-sm text-primary-green hover:bg-emerald-50 transition-colors font-medium"
                >
                  View all results for "{searchQuery}"
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link to="/stores" className="hidden lg:flex items-center gap-1.5 text-sm text-muted-text hover:text-primary-green transition-colors">
            <MapPin size={16} />
            <span>Stores</span>
          </Link>

          <Link to="/cart" className="relative text-dark-navy hover:text-primary-green transition-colors">
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent-orange text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-primary-green" />
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-muted-text m-0 leading-tight">Hello, {user.name.split(' ')[0]}</p>
                  <p className="text-xs font-bold text-dark-navy m-0 leading-tight flex items-center gap-0.5">Account <ChevronDown size={12} /></p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-card-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2">
                <div className="px-4 py-2 border-b border-card-border">
                  <p className="text-sm font-semibold text-dark-navy m-0">{user.name}</p>
                  <p className="text-xs text-muted-text m-0">{user.email}</p>
                </div>
                <Link to="/profile" className="block px-4 py-2.5 text-sm text-dark-navy hover:bg-emerald-50 hover:text-primary-green transition-colors">My Profile</Link>
                <Link to="/orders" className="block px-4 py-2.5 text-sm text-dark-navy hover:bg-emerald-50 hover:text-primary-green transition-colors">Orders</Link>
                <Link to="/wishlist" className="block px-4 py-2.5 text-sm text-dark-navy hover:bg-emerald-50 hover:text-primary-green transition-colors">Wishlist</Link>
                {user.role === 'storeOwner' && (
                  <Link to="/store-owner" className="block px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-medium transition-colors">📊 Store Dashboard</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="block px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-50 font-medium transition-colors">🛡️ Admin Panel</Link>
                )}
                {user.role === 'cashier' && (
                  <Link to="/pos" className="block px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 font-medium transition-colors">🧾 POS Terminal</Link>
                )}
                <hr className="my-1 border-card-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="flex items-center gap-2 text-dark-navy hover:text-primary-green transition-colors">
              <User size={22} />
              <span className="hidden md:inline text-sm font-medium">Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-dark-navy"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-card-border px-4 py-4 space-y-3">
          <form onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-card-border rounded-full py-2.5 px-5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </form>
          <Link to="/shop" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-dark-navy font-medium hover:text-primary-green">All Products</Link>
          <Link to="/deals" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-dark-navy font-medium hover:text-primary-green">Deals</Link>
          <Link to="/stores" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-dark-navy font-medium hover:text-primary-green">Stores</Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
