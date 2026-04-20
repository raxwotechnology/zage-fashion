const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  generatePayHereHash,
  requestPaymentOtp,
  verifyPaymentOtp,
  payHereNotify,
  getStoreOrders,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public PayHere IPN callback
router.post('/payhere-notify', payHereNotify);

// Protected routes
router.route('/').post(protect, createOrder);
router.route('/my').get(protect, getMyOrders);
router.route('/store').get(protect, authorize('manager'), getStoreOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, authorize('manager', 'admin'), updateOrderStatus);
router.route('/:id/payhere-hash').post(protect, generatePayHereHash);
router.route('/:id/payment-otp/request').post(protect, requestPaymentOtp);
router.route('/:id/payment-otp/verify').post(protect, verifyPaymentOtp);

module.exports = router;

