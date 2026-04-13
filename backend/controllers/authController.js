const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400); return next(new Error('User already exists')); }
    const user = await User.create({ name, email, password, phone, role: role || 'customer' });
    if (user) {
      res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token: generateToken(user._id) });
    } else { res.status(400); next(new Error('Invalid user data')); }
  } catch (error) { next(error); }
};

const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token: generateToken(user._id) });
    } else { res.status(401); next(new Error('Invalid email or password')); }
  } catch (error) { next(error); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar, addresses: user.addresses });
    } else { res.status(404); next(new Error('User not found')); }
  } catch (error) { next(error); }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) { res.status(404); return next(new Error('User not found')); }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.email && req.body.email !== user.email) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) { res.status(400); return next(new Error('Email already in use')); }
      user.email = req.body.email;
    }
    if (req.body.password) { user.password = req.body.password; }
    if (req.body.addresses) { user.addresses = req.body.addresses; }

    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone, addresses: updated.addresses, token: generateToken(updated._id) });
  } catch (error) { next(error); }
};

module.exports = { registerUser, authUser, getMe, updateProfile };
