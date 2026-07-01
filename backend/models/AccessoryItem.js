const mongoose = require('mongoose');

const AccessoryItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  modelCompatibility: {
    type: String,
    default: null,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    default: null,
    min: 0
  },
  supplier: {
    type: String,
    default: null,
    trim: true
  },
  status: {
    type: String,
    enum: ['available', 'sold_out'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AccessoryItem', AccessoryItemSchema);
