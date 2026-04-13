const express = require('express');
const router = express.Router();
const {
  getProducts,
  searchProducts,
  getFeaturedProducts,
  getDeals,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public routes (order matters — put specific before :id)
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/deals', getDeals);
router.get('/my-store', protect, authorize('storeOwner'), getMyProducts);

router.route('/')
  .get(getProducts)
  .post(protect, authorize('storeOwner', 'admin'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('storeOwner', 'admin'), updateProduct)
  .delete(protect, authorize('storeOwner', 'admin'), deleteProduct);

module.exports = router;

