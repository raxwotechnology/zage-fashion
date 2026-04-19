const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { isValidEmail, isValidSLPhone, formatSLPhone } = require('../utils/validators');

const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      res.status(400);
      return next(new Error('Name, email and password are required'));
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400);
      return next(new Error('Please enter a valid email address'));
    }

    // Validate phone if provided (Sri Lankan format)
    if (phone && !isValidSLPhone(phone)) {
      res.status(400);
      return next(new Error('Please enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567)'));
    }

    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400); return next(new Error('User already exists')); }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone ? formatSLPhone(phone) : '',
      role: role || 'customer',
    });

    if (user) {
      res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token: generateToken(user._id) });
    } else { res.status(400); next(new Error('Invalid user data')); }
  } catch (error) { next(error); }
};

const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      return next(new Error('Email and password are required'));
    }

    const user = await User.findOne({ email });

    if (!user) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    // Check if account is deactivated
    if (user.isActive === false) {
      res.status(403);
      return next(new Error('Your account has been deactivated. Please contact the administrator.'));
    }

    if (await user.matchPassword(password)) {
      res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, token: generateToken(user._id) });
    } else {
      res.status(401);
      next(new Error('Invalid email or password'));
    }
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

    // Validate phone if being updated
    if (req.body.phone && !isValidSLPhone(req.body.phone)) {
      res.status(400);
      return next(new Error('Please enter a valid Sri Lankan phone number'));
    }
    if (req.body.phone) {
      user.phone = formatSLPhone(req.body.phone);
    }

    if (req.body.email && req.body.email !== user.email) {
      if (!isValidEmail(req.body.email)) {
        res.status(400);
        return next(new Error('Please enter a valid email address'));
      }
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
