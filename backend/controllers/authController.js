const User = require('../models/User');
const AccessoryCategory = require('../models/AccessoryCategory');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { email, password, storeName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      storeName: storeName || 'My Mobile Shop'
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        storeName: user.storeName,
        settings: user.settings,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user data
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      user.storeName = req.body.storeName;
    }

    if (req.body.settings) {
      user.settings = {
        ...user.settings.toObject(),
        ...req.body.settings
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserSettings
};
