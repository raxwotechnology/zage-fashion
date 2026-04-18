const Store = require('../models/Store');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Public
const getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true })
      .populate('managerId', 'name email');
    res.json(stores);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('managerId', 'name email');
    if (store) {
      res.json(store);
    } else {
      res.status(404);
      next(new Error('Store not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get my store (manager)
// @route   GET /api/stores/my
// @access  Private/Manager
const getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ managerId: req.user._id });
    if (store) {
      res.json(store);
    } else {
      res.status(404);
      next(new Error('No store found for this user'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a store
// @route   POST /api/stores
// @access  Private/Manager
const createStore = async (req, res, next) => {
  try {
    const { name, description, address, city, phone, email, bannerImage, logo, operatingHours } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const existingStore = await Store.findOne({ managerId: req.user._id });
    if (existingStore) {
      res.status(400);
      return next(new Error('You already have a store registered'));
    }

    const store = await Store.create({
      managerId: req.user._id,
      name,
      slug,
      description,
      address,
      city,
      phone,
      email,
      bannerImage,
      logo,
      operatingHours,
    });

    res.status(201).json(store);
  } catch (error) {
    next(error);
  }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private/Manager
const updateStore = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      res.status(404);
      return next(new Error('Store not found'));
    }

    if (store.managerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(403);
      return next(new Error('Not authorized to update this store'));
    }

    const fields = ['name', 'description', 'address', 'city', 'phone', 'email', 'bannerImage', 'logo', 'operatingHours', 'isActive'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        store[field] = req.body[field];
      }
    });
    if (req.body.name) store.slug = req.body.name.toLowerCase().replace(/\s+/g, '-');

    const updated = await store.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStores,
  getStoreById,
  getMyStore,
  createStore,
  updateStore,
};
