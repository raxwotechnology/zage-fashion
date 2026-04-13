import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
});

API.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  if (userInfo) {
    const { token } = JSON.parse(userInfo);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Products
export const getProducts = (params) => API.get('/products', { params });
export const getProductById = (id) => API.get(`/products/${id}`);
export const searchProducts = (q) => API.get('/products/search', { params: { q } });
export const getFeaturedProducts = () => API.get('/products/featured');
export const getDeals = () => API.get('/products/deals');
export const getMyStoreProducts = () => API.get('/products/my-store');
export const createProduct = (data) => API.post('/products', data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);

// Categories
export const getCategories = () => API.get('/categories');
export const createCategory = (data) => API.post('/categories', data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Stores
export const getStores = () => API.get('/stores');
export const getStoreById = (id) => API.get(`/stores/${id}`);
export const getMyStore = () => API.get('/stores/my');
export const createStore = (data) => API.post('/stores', data);
export const updateStore = (id, data) => API.put(`/stores/${id}`, data);

// Cart
export const getCart = () => API.get('/cart');
export const addToCart = (data) => API.post('/cart/add', data);
export const updateCartItem = (data) => API.put('/cart/update', data);
export const removeFromCart = (productId) => API.delete(`/cart/remove/${productId}`);
export const clearCart = () => API.delete('/cart/clear');

// Wishlist
export const getWishlist = () => API.get('/wishlist');
export const addToWishlist = (productId) => API.post(`/wishlist/${productId}`);
export const removeFromWishlist = (productId) => API.delete(`/wishlist/${productId}`);

// Reviews
export const getProductReviews = (productId) => API.get(`/reviews/product/${productId}`);
export const createReview = (productId, data) => API.post(`/reviews/product/${productId}`, data);
export const updateReview = (id, data) => API.put(`/reviews/${id}`, data);
export const deleteReview = (id) => API.delete(`/reviews/${id}`);

// Orders
export const createOrder = (data) => API.post('/orders', data);
export const getMyOrders = () => API.get('/orders/my');
export const getOrderById = (id) => API.get(`/orders/${id}`);
export const getStoreOrders = () => API.get('/orders/store');
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data);
export const getPayHereHash = (orderId) => API.post(`/orders/${orderId}/payhere-hash`);

// Admin
export const getAdminStats = () => API.get('/admin/stats');
export const getAdminUsers = () => API.get('/admin/users');
export const updateUserRole = (id, data) => API.put(`/admin/users/${id}/role`, data);
export const deleteUser = (id) => API.delete(`/admin/users/${id}`);
export const getAdminStores = () => API.get('/admin/stores');
export const toggleStoreStatus = (id) => API.put(`/admin/stores/${id}/toggle`);
export const getAdminOrders = () => API.get('/admin/orders');

// POS (Cashier)
export const getPosProducts = (params) => API.get('/pos/products', { params });
export const getProductByBarcode = (code) => API.get(`/pos/products/barcode/${code}`);
export const posCheckout = (data) => API.post('/pos/checkout', data);
export const getPosOrders = () => API.get('/pos/orders');
export const getPosOrderById = (id) => API.get(`/pos/orders/${id}`);

export default API;
