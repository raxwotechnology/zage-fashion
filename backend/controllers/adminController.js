const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all users
// @route   GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) { next(error); }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }
    user.role = req.body.role;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (error) { next(error); }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) { res.status(404); return next(new Error('User not found')); }
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } catch (error) { next(error); }
};

// @desc    Get all stores (including inactive)
// @route   GET /api/admin/stores
const getAllStores = async (req, res, next) => {
  try {
    const stores = await Store.find({}).populate('ownerId', 'name email').sort({ createdAt: -1 });
    res.json(stores);
  } catch (error) { next(error); }
};

// @desc    Toggle store active status
// @route   PUT /api/admin/stores/:id/toggle
const toggleStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) { res.status(404); return next(new Error('Store not found')); }
    store.isActive = !store.isActive;
    await store.save();
    res.json(store);
  } catch (error) { next(error); }
};

// @desc    Get all orders
// @route   GET /api/admin/orders
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('userId', 'name email')
      .populate('storeId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) { next(error); }
};

// @desc    Get platform stats
// @route   GET /api/admin/stats
const getStats = async (req, res, next) => {
  try {
    const [users, stores, products, orders] = await Promise.all([
      User.countDocuments(),
      Store.countDocuments(),
      Product.countDocuments(),
      Order.find({}),
    ]);
    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
    const completedOrders = orders.filter((o) => o.orderStatus === 'delivered').length;

    res.json({
      users, stores, products,
      totalOrders: orders.length,
      totalRevenue,
      pendingOrders,
      completedOrders,
    });
  } catch (error) { next(error); }
};

module.exports = { getUsers, updateUserRole, deleteUser, getAllStores, toggleStore, getAllOrders, getStats };
