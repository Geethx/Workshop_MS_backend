const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    sparse: true,  // Allow multiple null/undefined values
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'user-admin', 'staff'],
    default: 'staff'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create case-insensitive index for name field
userSchema.index({ name: 1 }, { 
  unique: true,
  collation: { locale: 'en', strength: 2 } 
});

// Pre-save middleware to ensure consistent name casing
userSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    // Keep the original casing but trim whitespace
    this.name = this.name.trim();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
