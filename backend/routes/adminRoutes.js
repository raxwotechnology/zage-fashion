const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getAllStores,
  toggleStore,
  getAllOrders,
  approveOrder,
  cancelOrder,
  getStats,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Stores
router.get('/stores', getAllStores);
router.put('/stores/:id/toggle', toggleStore);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:id/approve', approveOrder);
router.put('/orders/:id/cancel', cancelOrder);

module.exports = router;
