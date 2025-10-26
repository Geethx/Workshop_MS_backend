const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  getItemByCode,
  createItem,
  updateItem,
  deleteItem,
  getDashboardStats
} = require('../controllers/item.controller');
const { auth, canModify, isAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get dashboard stats
router.get('/stats', getDashboardStats);

// Get all items
router.get('/', getAllItems);

// Get item by code (for barcode scanning)
router.get('/code/:code', getItemByCode);

// Get item by ID
router.get('/:id', getItemById);

// Create item (requires admin only)
router.post('/', isAdmin, createItem);

// Update item (requires staff or admin)
router.put('/:id', canModify, updateItem);

// Delete item (requires admin)
router.delete('/:id', isAdmin, deleteItem);

module.exports = router;
