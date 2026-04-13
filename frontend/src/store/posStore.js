import { create } from 'zustand';

const usePosStore = create((set, get) => ({
  cart: [],
  discount: 0,
  discountType: 'percentage', // 'percentage' or 'fixed'
  paymentMethod: 'cash',
  tenderedAmount: '',

  addItem: (product) => {
    const { cart } = get();
    const existing = cart.find((item) => item.productId === product._id);

    if (existing) {
      // Don't exceed stock
      if (existing.quantity >= product.stock) return;
      set({
        cart: cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      });
    } else {
      if (product.stock <= 0) return;
      set({
        cart: [
          ...cart,
          {
            productId: product._id,
            name: product.name,
            image: product.images?.[0] || '',
            price: product.price,
            stock: product.stock,
            unit: product.unit,
            barcode: product.barcode || '',
            quantity: 1,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ cart: get().cart.filter((item) => item.productId !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      ),
    });
  },

  setDiscount: (value, type) => {
    set({ discount: value, discountType: type });
  },

  setPaymentMethod: (method) => {
    set({ paymentMethod: method });
  },

  setTenderedAmount: (amount) => {
    set({ tenderedAmount: amount });
  },

  clearCart: () => {
    set({
      cart: [],
      discount: 0,
      discountType: 'percentage',
      paymentMethod: 'cash',
      tenderedAmount: '',
    });
  },

  // Computed values
  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getDiscountAmount: () => {
    const subtotal = get().getSubtotal();
    const { discount, discountType } = get();
    if (!discount || discount <= 0) return 0;
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    }
    return Math.min(discount, subtotal);
  },

  getTax: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    return parseFloat(((subtotal - discountAmount) * 0.05).toFixed(2));
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const discountAmount = get().getDiscountAmount();
    const tax = get().getTax();
    return parseFloat((subtotal - discountAmount + tax).toFixed(2));
  },

  getChange: () => {
    const { tenderedAmount } = get();
    const total = get().getGrandTotal();
    const tendered = parseFloat(tenderedAmount);
    if (isNaN(tendered) || tendered < total) return 0;
    return parseFloat((tendered - total).toFixed(2));
  },
}));

export default usePosStore;
