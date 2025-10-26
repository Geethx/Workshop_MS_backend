const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { name, role, isActive, password } = req.body;
    const requestingUserId = req.user._id.toString();
    const requestingUserRole = req.user.role;
    const targetUserId = req.params.id;

    // Get the user being updated
    const targetUser = await User.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // user-admin cannot edit other user-admin accounts
    if (requestingUserRole === 'user-admin') {
      if (targetUser.role === 'user-admin' && requestingUserId !== targetUserId) {
        return res.status(403).json({
          success: false,
          message: 'User admins cannot edit other user-admin accounts'
        });
      }
    }

    // Prevent editing other admin accounts (only allow editing own admin account)
    if (targetUser.role === 'admin' && requestingUserId !== targetUserId && requestingUserRole === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit another admin account'
      });
    }

    // Prevent user-admin from updating role to user-admin
    if (requestingUserRole === 'user-admin' && role === 'user-admin') {
      return res.status(403).json({
        success: false,
        message: 'User admins cannot promote users to user-admin role'
      });
    }

    const updateData = { name, role, isActive };

    // If updating own admin account, force keep admin role
    if (targetUser.role === 'admin' && requestingUserId === targetUserId) {
      updateData.role = 'admin';
    }

    // If updating own user-admin account, force keep user-admin role
    if (targetUser.role === 'user-admin' && requestingUserId === targetUserId) {
      updateData.role = 'user-admin';
    }

    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      targetUserId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// Create user (admin or user-admin)
exports.createUser = async (req, res) => {
  try {
    const { name, password, role } = req.body;
    const requestingUserRole = req.user.role;

    console.log('Creating user with:', { name, role, passwordLength: password?.length });

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

    // Prevent creating user-admin users (only through register endpoint)
    if (role === 'user-admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create user-admin users. Use the register endpoint for initial setup.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (admin, staff, or viewer)
    const user = new User({
      name,
      password: hashedPassword,
      role: role || 'staff',
      email: undefined  // Explicitly set to undefined since it's optional
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const requestingUserRole = req.user.role;
    const requestingUserId = req.user._id.toString();
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting user-admin accounts
    if (user.role === 'user-admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete user-admin accounts'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};
