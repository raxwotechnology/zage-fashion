const express = require('express');
const router = express.Router();
const {
  getMyDeliveries,
  getDeliveryHistory,
  updateDeliveryStatus,
  getDeliveryEarnings,
  assignDeliveryGuy,
  getAvailableDeliveryGuys,
} = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

// Delivery guy routes
router.get('/orders', authorize('deliveryGuy'), getMyDeliveries);
router.get('/history', authorize('deliveryGuy'), getDeliveryHistory);
router.get('/earnings', authorize('deliveryGuy'), getDeliveryEarnings);
router.put('/orders/:id/status', authorize('deliveryGuy'), updateDeliveryStatus);

// Manager/Admin routes
router.post('/assign/:orderId', authorize('manager', 'admin'), assignDeliveryGuy);
router.get('/available', authorize('manager', 'admin'), getAvailableDeliveryGuys);

module.exports = router;
