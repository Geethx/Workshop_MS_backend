const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: [true, 'Item reference is required']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  action: {
    type: String,
    enum: ['CheckIn', 'CheckOut'],
    required: [true, 'Action type is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  itemCode: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  checkoutPerson: {
    type: String,
    trim: true
  },
  projectName: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ item: 1, timestamp: -1 });
transactionSchema.index({ user: 1, timestamp: -1 });
transactionSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
