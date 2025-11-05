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

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Sanitize name input
    const sanitizedName = name.trim();
    if (sanitizedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      name: { $regex: new RegExp(`^${sanitizedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } 
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this name already exists'
      });
    }

    // Hash password with higher cost factor
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const user = new User({
      name: sanitizedName,
      password: hashedPassword,
      role: role || 'staff'
    });

    await user.save();

    // Generate token with shorter expiry for better security
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Changed from 7d to 24h
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
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user'
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate input
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both username and password'
      });
    }

    // Sanitize name and escape special regex characters
    const sanitizedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find user with case-insensitive name search and include password field
    const user = await User.findOne({ 
      name: { $regex: new RegExp(`^${sanitizedName}$`, 'i') } 
    }).select('+password');
    
    if (!user) {
      // Generic error message to prevent username enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please try again.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      });
    }

    // Check password - use timing-safe comparison
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Generic error message to prevent username enumeration
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please try again.'
      });
    }

    // Generate token with shorter expiry
    const token = jwt.sign(
      { userId: user._id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Changed from 7d to 24h for better security
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
