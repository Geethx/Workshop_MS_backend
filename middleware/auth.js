const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not active.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message
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
  if (req.user.role === 'viewer' || req.user.role === 'user-admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You do not have permission to modify data.'
    });
  }
  next();
};

module.exports = { auth, isAdmin, canModify, canManageUsers };
