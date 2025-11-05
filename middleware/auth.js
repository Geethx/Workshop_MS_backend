const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please login again.'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error.'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// Check if user can manage users (admin or user-admin)
const canManageUsers = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'user-admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User management privileges required.'
    });
  }
  next();
};

// Check if user can modify data (admin or staff) - but NOT user-admin
const canModify = (req, res, next) => {
  if (req.user.role === 'user-admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to modify data.'
    });
  }
  next();
};

module.exports = { auth, isAdmin, canModify, canManageUsers };
