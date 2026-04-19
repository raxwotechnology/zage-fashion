import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Camera,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  LogOut,
  CreditCard,
  Banknote,
  Receipt,
  Package,
  AlertTriangle,
  X,
  Percent,
  DollarSign,
  Clock,
  TrendingUp,
  Ticket,
  User,
  Phone,
  Smartphone,
} from 'lucide-react';
import { getPosProducts, getProductByBarcode, posCheckout, getPosOrders, applyVoucher, getSettings } from '../../services/api';
import usePosStore from '../../store/posStore';
import useAuthStore from '../../store/authStore';
import BarcodeScannerModal from './BarcodeScannerModal';
import InvoiceModal from './InvoiceModal';
import { toast } from 'react-toastify';

const POSScreen = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const pos = usePosStore();

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [shiftData, setShiftData] = useState(null);
  const [discountInput, setDiscountInput] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  const [discountTypeInput, setDiscountTypeInput] = useState('percentage');

  const searchRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load initial products + settings for tax rate
  useEffect(() => {
    loadProducts();
    loadTaxRate();
  }, []);

  const loadTaxRate = async () => {
    try {
      const { data } = await getSettings();
      if (data?.taxRate !== undefined) pos.setTaxRate(data.taxRate);
    } catch (err) { /* use default */ }
  };

  // Focus search on mount
  useEffect(() => {
    if (searchRef.current) searchRef.current.focus();
  }, []);

  const loadProducts = async (search = '') => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const { data } = await getPosProducts(params);
      setProducts(data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearch = (value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      loadProducts(value);
    }, 300);
  };

  // Handle search enter (add first result)
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && products.length > 0) {
      e.preventDefault();
      pos.addItem(products[0]);
      toast.success(`Added ${products[0].name}`, { autoClose: 1000 });
      setSearchQuery('');
      loadProducts();
    }
  };

  // Barcode scan handler
  const handleBarcodeScan = async (code) => {
    try {
      const { data } = await getProductByBarcode(code);
      pos.addItem(data);
      toast.success(`Scanned: ${data.name}`, { autoClose: 1500 });
    } catch (err) {
      toast.error(`No product found for barcode: ${code}`);
    }
  };

  // Add product to cart
  const handleAddProduct = (product) => {
    pos.addItem(product);
    toast.success(`Added ${product.name}`, { autoClose: 800 });
  };

  // Apply discount
  const handleApplyDiscount = () => {
    const value = parseFloat(discountInput);
    if (isNaN(value) || value <= 0) {
      toast.error('Enter a valid discount');
      return;
    }
    if (discountTypeInput === 'percentage' && value > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }
    pos.setDiscount(value, discountTypeInput);
    setShowDiscount(false);
    setDiscountInput('');
    toast.success('Discount applied!');
  };

  // Apply coupon/voucher
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) { toast.error('Enter a coupon code'); return; }
    setApplyingCoupon(true);
    try {
      const { data } = await applyVoucher({ code: couponCode.toUpperCase(), orderTotal: pos.getSubtotal() });
      pos.setCoupon({
        code: data.code || couponCode.toUpperCase(),
        value: data.discount || data.value,
        type: data.type || 'percentage',
        maxDiscount: data.maxDiscountAmount,
        description: data.description || '',
      });
      toast.success(`Coupon applied: ${data.description || couponCode.toUpperCase()} 🎉`);
      setCouponCode('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Checkout
  const handleCheckout = async () => {
    if (pos.cart.length === 0) {
      toast.warning('Cart is empty');
      return;
    }

    if (pos.paymentMethod === 'cash') {
      const tendered = parseFloat(pos.tenderedAmount);
      if (isNaN(tendered) || tendered < pos.getGrandTotal()) {
        toast.error('Tendered amount must be at least the total amount');
        return;
      }
    }

    try {
      setCheckingOut(true);
      const { data } = await posCheckout({
        items: pos.cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        })),
        paymentMethod: pos.paymentMethod,
        tenderedAmount: pos.paymentMethod === 'cash' ? parseFloat(pos.tenderedAmount) : undefined,
        discount: pos.discount,
        discountType: pos.discountType,
        couponCode: pos.coupon?.code || undefined,
        customerName: pos.customerName || undefined,
        customerPhone: pos.customerPhone || undefined,
      });

      setLastOrder(data);
      setShowInvoice(true);
      toast.success('Sale completed! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  // New sale - clear cart and reload products
  const handleNewSale = () => {
    pos.clearCart();
    setLastOrder(null);
    loadProducts();
    if (searchRef.current) searchRef.current.focus();
  };

  // Shift summary
  const handleShiftSummary = async () => {
    try {
      const { data } = await getPosOrders();
      setShiftData(data);
      setShowShiftSummary(true);
    } catch (err) {
      toast.error('Failed to load shift data');
    }
  };

  // Logout
  const handleLogout = () => {
    pos.clearCart();
    logout();
    navigate('/cashier-login');
  };

  const subtotal = pos.getSubtotal();
  const discountAmount = pos.getDiscountAmount();
  const couponDiscount = pos.getCouponDiscount();
  const totalDiscount = pos.getTotalDiscount();
  const taxPercent = (pos.taxRate * 100).toFixed(0);
  const tax = pos.getTax();
  const grandTotal = pos.getGrandTotal();
  const change = pos.getChange();

  return (
    <div className="pos-screen">
      {/* Top Bar */}
      <header className="pos-topbar">
        <div className="pos-topbar-left">
          <ShoppingCart size={26} className="pos-topbar-icon" />
          <h1 className="pos-topbar-title">FreshCart POS</h1>
        </div>
        <div className="pos-topbar-center">
          <span className="pos-topbar-store">{user?.assignedStoreName || 'Store'}</span>
        </div>
        <div className="pos-topbar-right">
          <button className="pos-topbar-btn" onClick={handleShiftSummary} title="Shift Summary">
            <TrendingUp size={18} />
            <span className="pos-topbar-btn-text">Shift</span>
          </button>
          <div className="pos-topbar-cashier">
            <div className="pos-topbar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <span className="pos-topbar-cashier-name">{user?.name}</span>
          </div>
          <button className="pos-topbar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="pos-main">
        {/* ──────── LEFT PANEL: Products ──────── */}
        <div className="pos-products-panel">
          {/* Search Bar */}
          <div className="pos-search-bar">
            <div className="pos-search-input-wrapper">
              <Search size={20} className="pos-search-icon" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search by name, barcode, or SKU... (Enter to quick-add)"
                className="pos-search-input"
              />
              {searchQuery && (
                <button
                  className="pos-search-clear"
                  onClick={() => { setSearchQuery(''); loadProducts(); }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              className="pos-scan-btn"
              onClick={() => setShowScanner(true)}
              title="Scan Barcode"
            >
              <Camera size={22} />
            </button>
          </div>

          {/* Product Grid */}
          <div className="pos-product-grid">
            {loading ? (
              <div className="pos-loading">
                <div className="pos-spinner" />
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="pos-empty">
                <Package size={48} />
                <p>No products found</p>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product._id}
                  className={`pos-product-card ${product.stock <= 0 ? 'pos-out-of-stock' : ''}`}
                  onClick={() => product.stock > 0 && handleAddProduct(product)}
                >
                  <div className="pos-product-img-wrapper">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="pos-product-img"
                        loading="lazy"
                      />
                    ) : (
                      <div className="pos-product-img-placeholder">
                        <Package size={28} />
                      </div>
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="pos-stock-badge pos-stock-low">Low</span>
                    )}
                    {product.stock <= 0 && (
                      <span className="pos-stock-badge pos-stock-out">Out</span>
                    )}
                  </div>
                  <div className="pos-product-info">
                    <h4 className="pos-product-name">{product.name}</h4>
                    <div className="pos-product-meta">
                      <span className="pos-product-price">Rs. {product.price.toFixed(2)}</span>
                      <span className="pos-product-unit">/{product.unit}</span>
                    </div>
                    <div className="pos-product-stock-row">
                      <span className={`pos-product-stock ${product.stock <= 5 ? 'low' : ''}`}>
                        Stock: {product.stock}
                      </span>
                      {product.barcode && (
                        <span className="pos-product-barcode">{product.barcode}</span>
                      )}
                    </div>
                  </div>
                  {product.stock > 0 && (
                    <button className="pos-product-add-btn">
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ──────── RIGHT PANEL: Cart ──────── */}
        <div className="pos-cart-panel">
          <div className="pos-cart-header">
            <Receipt size={20} />
            <h2>Current Sale</h2>
            <span className="pos-cart-count">{pos.cart.length} items</span>
          </div>

          {/* Cart Items */}
          <div className="pos-cart-items">
            {pos.cart.length === 0 ? (
              <div className="pos-cart-empty">
                <ShoppingCart size={40} />
                <p>No items added yet</p>
                <span>Search or scan to add products</span>
              </div>
            ) : (
              pos.cart.map((item) => (
                <div key={item.productId} className="pos-cart-item">
                  <div className="pos-cart-item-info">
                    <h4 className="pos-cart-item-name">{item.name}</h4>
                    <p className="pos-cart-item-price">
                      Rs.{item.price.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <div className="pos-cart-item-controls">
                    <div className="pos-qty-controls">
                      <button
                        className="pos-qty-btn"
                        onClick={() => pos.updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="pos-qty-value">{item.quantity}</span>
                      <button
                        className="pos-qty-btn"
                        onClick={() => pos.updateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="pos-cart-item-total">
                      Rs.{(item.price * item.quantity).toFixed(2)}
                    </span>
                    <button
                      className="pos-cart-remove"
                      onClick={() => pos.removeItem(item.productId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          {pos.cart.length > 0 && (
            <div className="pos-cart-totals">
              <div className="pos-total-row">
                <span>Subtotal</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="pos-total-row pos-discount-row">
                  <span>
                    Discount
                    {pos.discountType === 'percentage' ? ` (${pos.discount}%)` : ''}
                  </span>
                  <span>-Rs. {discountAmount.toFixed(2)}</span>
                  <button
                    className="pos-discount-clear"
                    onClick={() => pos.setDiscount(0, 'percentage')}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="pos-total-row pos-discount-row">
                  <span>
                    🎟️ Coupon ({pos.coupon?.code})
                  </span>
                  <span>-Rs. {couponDiscount.toFixed(2)}</span>
                  <button
                    className="pos-discount-clear"
                    onClick={() => pos.clearCoupon()}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              <div className="pos-total-row">
                <span>Tax ({taxPercent}%)</span>
                <span>Rs. {tax.toFixed(2)}</span>
              </div>
              <div className="pos-total-row pos-grand-total">
                <span>TOTAL</span>
                <span>Rs. {grandTotal.toFixed(2)}</span>
              </div>

              {/* Coupon Input */}
              <div style={{display:'flex', gap:'6px', marginBottom:'8px'}}>
                <div style={{flex:1, position:'relative'}}>
                  <Ticket size={16} style={{position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#9ca3af'}} />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Coupon code"
                    className="pos-input"
                    style={{paddingLeft:'32px', width:'100%', fontSize:'13px'}}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  />
                </div>
                <button
                  className="pos-btn-green"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon}
                  style={{padding:'8px 14px', fontSize:'12px', whiteSpace:'nowrap'}}
                >
                  {applyingCoupon ? '...' : 'Apply'}
                </button>
              </div>

              {/* Discount Button */}
              <button
                className="pos-apply-discount-btn"
                onClick={() => setShowDiscount(true)}
              >
                <Percent size={16} />
                Apply Discount
              </button>

              {/* Customer Info Toggle */}
              <button
                className="pos-apply-discount-btn"
                onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                style={{marginTop:'4px', background: showCustomerInfo ? '#dbeafe' : undefined, color: showCustomerInfo ? '#2563eb' : undefined}}
              >
                <User size={16} />
                {pos.customerName ? `Customer: ${pos.customerName}` : 'Add Customer Info'}
              </button>
              {showCustomerInfo && (
                <div style={{display:'flex', gap:'6px', marginBottom:'6px'}}>
                  <input
                    type="text"
                    value={pos.customerName}
                    onChange={(e) => pos.setCustomerInfo(e.target.value, pos.customerPhone)}
                    placeholder="Customer name"
                    className="pos-input"
                    style={{flex:1, fontSize:'12px'}}
                  />
                  <input
                    type="tel"
                    value={pos.customerPhone}
                    onChange={(e) => pos.setCustomerInfo(pos.customerName, e.target.value)}
                    placeholder="Phone"
                    className="pos-input"
                    style={{flex:1, fontSize:'12px'}}
                  />
                </div>
              )}

              {/* Payment Method */}
              <div className="pos-payment-methods">
                <button
                  className={`pos-payment-btn ${pos.paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => pos.setPaymentMethod('cash')}
                >
                  <Banknote size={20} />
                  Cash
                </button>
                <button
                  className={`pos-payment-btn ${pos.paymentMethod === 'card' ? 'active' : ''}`}
                  onClick={() => pos.setPaymentMethod('card')}
                >
                  <CreditCard size={20} />
                  Card
                </button>
                <button
                  className={`pos-payment-btn ${pos.paymentMethod === 'koko' ? 'active' : ''}`}
                  onClick={() => pos.setPaymentMethod('koko')}
                  title="Koko Pay - Buy Now Pay Later"
                >
                  <Smartphone size={20} />
                  Koko
                </button>
              </div>

              {/* Cash tendered */}
              {pos.paymentMethod === 'cash' && (
                <div className="pos-cash-section">
                  <label className="pos-cash-label">Amount Tendered</label>
                  <div className="pos-cash-input-wrapper">
                    <span className="pos-cash-icon" style={{fontSize:'14px', fontWeight:'bold', color:'#9ca3af'}}>Rs.</span>
                    <input
                      type="number"
                      value={pos.tenderedAmount}
                      onChange={(e) => pos.setTenderedAmount(e.target.value)}
                      placeholder="0.00"
                      className="pos-cash-input"
                      min={grandTotal}
                      step="0.01"
                    />
                  </div>
                  {parseFloat(pos.tenderedAmount) >= grandTotal && (
                    <div className="pos-change-display">
                      <span>Change Due:</span>
                      <span className="pos-change-amount">Rs. {change.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkout Button */}
              <button
                className="pos-checkout-btn"
                onClick={handleCheckout}
                disabled={checkingOut || pos.cart.length === 0}
              >
                {checkingOut ? (
                  <span className="pos-spinner-sm" />
                ) : (
                  <>
                    <Receipt size={22} />
                    CHECKOUT — Rs. {grandTotal.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ──────── MODALS ──────── */}

      {/* Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />

      {/* Invoice */}
      <InvoiceModal
        isOpen={showInvoice}
        onClose={() => setShowInvoice(false)}
        order={lastOrder}
        onNewSale={handleNewSale}
      />

      {/* Discount Modal */}
      {showDiscount && (
        <div className="pos-modal-overlay" onClick={() => setShowDiscount(false)}>
          <div className="pos-discount-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-discount-header">
              <h3>Apply Discount</h3>
              <button onClick={() => setShowDiscount(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pos-discount-body">
              <div className="pos-discount-type-toggle">
                <button
                  className={`pos-discount-type-btn ${discountTypeInput === 'percentage' ? 'active' : ''}`}
                  onClick={() => setDiscountTypeInput('percentage')}
                >
                  <Percent size={16} />
                  Percentage
                </button>
                <button
                  className={`pos-discount-type-btn ${discountTypeInput === 'fixed' ? 'active' : ''}`}
                  onClick={() => setDiscountTypeInput('fixed')}
                >
                  <DollarSign size={16} />
                  Fixed Amount
                </button>
              </div>
              <input
                type="number"
                value={discountInput}
                onChange={(e) => setDiscountInput(e.target.value)}
                placeholder={discountTypeInput === 'percentage' ? 'e.g. 10' : 'e.g. 5.00'}
                className="pos-input pos-discount-input"
                autoFocus
                min="0"
                step="0.01"
              />
              <button className="pos-btn-green pos-btn-lg" onClick={handleApplyDiscount}>
                Apply Discount
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Summary Modal */}
      {showShiftSummary && shiftData && (
        <div className="pos-modal-overlay" onClick={() => setShowShiftSummary(false)}>
          <div className="pos-shift-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pos-shift-header">
              <Clock size={22} />
              <h3>Shift Summary</h3>
              <button onClick={() => setShowShiftSummary(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="pos-shift-stats">
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Total Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.totalSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Transactions</span>
                <span className="pos-shift-stat-value">{shiftData.summary.totalOrders}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Cash Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.cashSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Card Sales</span>
                <span className="pos-shift-stat-value">Rs. {shiftData.summary.cardSales.toFixed(2)}</span>
              </div>
              <div className="pos-shift-stat">
                <span className="pos-shift-stat-label">Koko Sales</span>
                <span className="pos-shift-stat-value">Rs. {(shiftData.summary.kokoSales || 0).toFixed(2)}</span>
              </div>
            </div>
            {shiftData.orders.length > 0 && (
              <div className="pos-shift-orders">
                <h4>Recent Transactions</h4>
                {shiftData.orders.slice(0, 10).map((order) => (
                  <div key={order._id} className="pos-shift-order-row">
                    <span className="pos-shift-order-id">#{order._id.slice(-6)}</span>
                    <span className="pos-shift-order-method">{order.paymentMethod}</span>
                    <span className="pos-shift-order-items">{order.items.length} items</span>
                    <span className="pos-shift-order-total">Rs. {order.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default POSScreen;
