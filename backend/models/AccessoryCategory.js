const mongoose = require('mongoose');

const AccessoryCategorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  isCustom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure a user cannot duplicate a category name (case-insensitive check would be good, but unique combination is simpler)
AccessoryCategorySchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('AccessoryCategory', AccessoryCategorySchema);
