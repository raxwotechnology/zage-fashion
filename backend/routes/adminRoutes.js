const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUser, getAllStores, toggleStore, getAllOrders, getStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/stores', getAllStores);
router.put('/stores/:id/toggle', toggleStore);
router.get('/orders', getAllOrders);

module.exports = router;
