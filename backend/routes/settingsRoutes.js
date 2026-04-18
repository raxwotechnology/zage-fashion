const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');

// Multer config for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const types = /jpeg|jpg|png|gif|svg|webp/;
  cb(null, types.test(path.extname(file.originalname).toLowerCase()));
}});

// Public - get settings
router.get('/', getSettings);

// Admin only
router.put('/', protect, authorize('admin'), updateSettings);
router.post('/logo', protect, authorize('admin'), upload.single('logo'), uploadLogo);

module.exports = router;
