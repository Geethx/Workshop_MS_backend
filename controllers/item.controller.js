const Item = require('../models/Item');
const Transaction = require('../models/Transaction');

// Get all items
exports.getAllItems = async (req, res) => {
  try {
    const { status, category, search } = req.query;
    
    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await Item.find(query)
      .populate('currentUser', 'name email')
      .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching items',
      error: error.message
    });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id)
      .populate('currentUser', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// Get item by code (for barcode scanning)
exports.getItemByCode = async (req, res) => {
  try {
    const item = await Item.findOne({ code: req.params.code.toUpperCase() })
      .populate('currentUser', 'name email');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching item',
      error: error.message
    });
  }
};

// Create new item
exports.createItem = async (req, res) => {
  try {
    const { name, code, category, description, location, imageUrl } = req.body;

    // Check if item with code already exists
    const existingItem = await Item.findOne({ code: code.toUpperCase() });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'Item with this code already exists'
      });
    }

    const item = new Item({
      name,
      code: code.toUpperCase(),
      category,
      description,
      location,
      imageUrl,
      status: 'Inside'
    });

    await item.save();

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating item',
      error: error.message
    });
  }
};

// Update item
exports.updateItem = async (req, res) => {
  try {
    const { name, category, description, location, imageUrl } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        category, 
        description, 
        location,
        imageUrl,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item updated successfully',
      item
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating item',
      error: error.message
    });
  }
};

// Delete item
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting item',
      error: error.message
    });
  }
};

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const insideItems = await Item.countDocuments({ status: 'Inside' });
    const outsideItems = await Item.countDocuments({ status: 'Outside' });
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('item', 'name code')
      .populate('user', 'name');

    // Get category breakdown
    const categoryStats = await Item.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalItems,
        insideItems,
        outsideItems,
        recentTransactions,
        categoryStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};
