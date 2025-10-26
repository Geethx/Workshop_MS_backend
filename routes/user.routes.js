const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/user.controller');
const { auth, isAdmin, canManageUsers } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all users (admin or user-admin)
router.get('/', canManageUsers, getAllUsers);

// Create user (admin or user-admin)
router.post('/', canManageUsers, createUser);

// Get user by ID (admin or user-admin)
router.get('/:id', canManageUsers, getUserById);

// Update user (admin or user-admin)
router.put('/:id', canManageUsers, updateUser);

// Delete user (admin or user-admin)
router.delete('/:id', canManageUsers, deleteUser);

module.exports = router;
