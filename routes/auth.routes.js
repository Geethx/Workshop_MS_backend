const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth');

// Test endpoint
router.get('/test', (req, res) => {
  console.log('Test endpoint hit');
  res.json({
    success: false,
    message: 'This is a test error message'
  });
});

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', auth, getCurrentUser);

module.exports = router;
