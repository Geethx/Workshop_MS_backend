const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Item code is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['Inside', 'Outside'],
    default: 'Inside'
  },
  description: {
    type: String,
    trim: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  currentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  location: {
    type: String,
    trim: true,
    default: 'Workshop'
  },
  checkoutPerson: {
    type: String,
    trim: true,
    default: null
  },
  projectName: {
    type: String,
    trim: true,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster searches
itemSchema.index({ code: 1 });
itemSchema.index({ status: 1 });
itemSchema.index({ category: 1 });

module.exports = mongoose.model('Item', itemSchema);
