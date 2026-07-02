const User = require('../models/User');
const AccessoryCategory = require('../models/AccessoryCategory');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Email validation regex
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Password strength check
const isStrongPassword = (password) => {
  // At least 6 chars, 1 letter, 1 number
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /\d/.test(password);
};

// Sanitize user input (strip dangerous chars)
const sanitize = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/[${}]/g, '').trim();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, storeName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = sanitize(email).toLowerCase();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters with at least 1 letter and 1 number' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email: cleanEmail,
      password,
      storeName: sanitize(storeName) || 'My Mobile Shop'
    });

    if (user) {
      // Seed default accessory categories
      const defaultCategories = ['Earphones', 'Charger', 'Cable', 'Case', 'Screen Guard', 'Tempered Glass', 'Power Bank'];
      const seedPromises = defaultCategories.map(catName => 
        AccessoryCategory.create({
          user: user._id,
          name: catName,
          isCustom: false
        })
      );
      await Promise.all(seedPromises);

      res.status(201).json({
        _id: user._id,
        email: user.email,
        storeName: user.storeName,
        settings: user.settings,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const cleanEmail = sanitize(email).toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: cleanEmail });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        storeName: user.storeName,
        settings: user.settings,
        token: generateToken(user._id)
      });
    } else {
      // Generic message to prevent user enumeration
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
const updateUserSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.storeName) {
      user.storeName = sanitize(req.body.storeName);
    }

    if (req.body.settings) {
      // Whitelist allowed settings fields
      const allowedSettings = ['currency', 'lowStockThreshold', 'paymentMethods'];
      const cleanSettings = {};
      
      for (const key of allowedSettings) {
        if (req.body.settings[key] !== undefined) {
          cleanSettings[key] = req.body.settings[key];
        }
      }

      user.settings = {
        ...user.settings.toObject(),
        ...cleanSettings
      };
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      storeName: updatedUser.storeName,
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error('Settings update error:', error.message);
    res.status(500).json({ message: 'Failed to update settings' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserSettings
};
