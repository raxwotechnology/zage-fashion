const express = require('express');
const router = express.Router();
const {
  getPosProducts,
  getProductByBarcode,
  posCheckout,
  getPosOrders,
  getPosOrderById,
} = require('../controllers/posController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All POS routes require cashier role
router.use(protect, authorize('cashier'));

router.get('/products', getPosProducts);
router.get('/products/barcode/:code', getProductByBarcode);
router.post('/checkout', posCheckout);
router.get('/orders', getPosOrders);
router.get('/orders/:id', getPosOrderById);

module.exports = router;
