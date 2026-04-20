const express = require('express');
const router = express.Router();
const {
  registerUser,
  requestRegistrationOtp,
  verifyRegistrationOtp,
  authUser,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/register/request-otp', requestRegistrationOtp);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/login', authUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
