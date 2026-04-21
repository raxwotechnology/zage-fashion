const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createStockReceipt,
  listStockReceipts,
  createSupplierReturn,
  listSupplierReturns,
} = require('../controllers/stockController');

router.use(protect, authorize('admin', 'manager'));

router.route('/receipts')
  .get(listStockReceipts)
  .post(createStockReceipt);

router.route('/supplier-returns')
  .get(listSupplierReturns)
  .post(createSupplierReturn);

module.exports = router;

