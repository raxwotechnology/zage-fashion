const express = require('express');
const router = express.Router();
const {
  getStores,
  getStoreById,
  getMyStore,
  createStore,
  updateStore,
} = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my', protect, authorize('storeOwner'), getMyStore);

router.route('/')
  .get(getStores)
  .post(protect, authorize('storeOwner'), createStore);

router.route('/:id')
  .get(getStoreById)
  .put(protect, authorize('storeOwner', 'admin'), updateStore);

module.exports = router;
