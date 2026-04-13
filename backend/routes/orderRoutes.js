const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  generatePayHereHash,
  payHereNotify,
  getStoreOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public PayHere IPN callback
router.post('/payhere-notify', payHereNotify);

// Protected routes
router.route('/').post(protect, createOrder);
router.route('/my').get(protect, getMyOrders);
router.route('/store').get(protect, authorize('storeOwner'), getStoreOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, authorize('storeOwner', 'admin'), updateOrderStatus);
router.route('/:id/payhere-hash').post(protect, generatePayHereHash);

module.exports = router;

