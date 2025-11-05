const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, password, role } = req.body;

    // Validate input
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name and password are required'
      });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this name already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      password: hashedPassword,
      role: role || 'staff'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log('Login attempt:', { name, passwordProvided: !!password });

    // Validate input
    if (!name || !password) {
      console.log('Validation failed: missing name or password');
      return res.status(400).json({
        success: false,
        message: 'Please enter both username and password'
      });
    }

    // Find user with case-insensitive name search and include password field
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    }).select('+password');
    
    if (!user) {
      console.log('User not found for name:', name);
      return res.status(401).json({
        success: false,
        message: 'Login credentials incorrect. Please try again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', name);
      return res.status(401).json({
        success: false,
        message: 'Login credentials incorrect. Please try again.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};
