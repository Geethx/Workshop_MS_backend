const Transaction = require('../models/Transaction');
const Item = require('../models/Item');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const { action, startDate, endDate, itemId, userId } = req.query;
    
    // Build query
    let query = {};
    
    if (action) {
      query.action = action;
    }
    
    if (itemId) {
      query.item = itemId;
    }
    
    if (userId) {
      query.user = userId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('item', 'name code category')
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
};

// Get item transaction history
exports.getItemHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ item: req.params.itemId })
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching item history',
      error: error.message
    });
  }
};

// Check out item
exports.checkOutItem = async (req, res) => {
  try {
    const { code, notes, checkoutPerson, projectName } = req.body;

    // Find item by code
    const item = await Item.findOne({ code: code.toUpperCase() });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is already outside
    if (item.status === 'Outside') {
      return res.status(400).json({
        success: false,
        message: 'Item is already checked out'
      });
    }

    // Update item status
    item.status = 'Outside';
    item.currentUser = req.user._id;
    item.checkoutPerson = checkoutPerson || req.user.name;
    item.projectName = projectName;
    item.lastUpdated = Date.now();
    await item.save();

    // Create transaction record
    const transaction = new Transaction({
      item: item._id,
      user: req.user._id,
      action: 'CheckOut',
      notes,
      itemCode: item.code,
      itemName: item.name,
      userName: req.user.name,
      checkoutPerson: checkoutPerson || req.user.name,
      projectName: projectName
    });

    await transaction.save();

    // Populate transaction
    await transaction.populate('item', 'name code category');
    await transaction.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Item checked out successfully',
      item,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking out item',
      error: error.message
    });
  }
};

// Check in item
exports.checkInItem = async (req, res) => {
  try {
    const { code, notes } = req.body;

    // Find item by code
    const item = await Item.findOne({ code: code.toUpperCase() });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    // Check if item is already inside
    if (item.status === 'Inside') {
      return res.status(400).json({
        success: false,
        message: 'Item is already checked in'
      });
    }

    // Update item status
    item.status = 'Inside';
    item.currentUser = null;
    item.checkoutPerson = null;
    item.projectName = null;
    item.lastUpdated = Date.now();
    await item.save();

    // Create transaction record
    const transaction = new Transaction({
      item: item._id,
      user: req.user._id,
      action: 'CheckIn',
      notes,
      itemCode: item.code,
      itemName: item.name,
      userName: req.user.name
    });

    await transaction.save();

    // Populate transaction
    await transaction.populate('item', 'name code category');
    await transaction.populate('user', 'name email');

    res.json({
      success: true,
      message: 'Item checked in successfully',
      item,
      transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in item',
      error: error.message
    });
  }
};

// Get recent transactions (last 24 hours)
exports.getRecentTransactions = async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const transactions = await Transaction.find({
      timestamp: { $gte: yesterday }
    })
      .populate('item', 'name code category')
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent transactions',
      error: error.message
    });
  }
};
