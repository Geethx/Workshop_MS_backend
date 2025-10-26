const express = require('express');
const router = express.Router();
const {
  getAllTransactions,
  getItemHistory,
  checkOutItem,
  checkInItem,
  getRecentTransactions
} = require('../controllers/transaction.controller');
const { auth, canModify } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all transactions
router.get('/', getAllTransactions);

// Get recent transactions
router.get('/recent', getRecentTransactions);

// Get item history
router.get('/item/:itemId', getItemHistory);

// Check out item (requires staff or admin)
router.post('/checkout', canModify, checkOutItem);

// Check in item (requires staff or admin)
router.post('/checkin', canModify, checkInItem);

module.exports = router;
