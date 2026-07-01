const mongoose = require('mongoose');

const PhoneSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  variant: {
    type: String,
    default: null,
    trim: true
  },
  ram: {
    type: String,
    default: null,
    trim: true
  },
  storage: {
    type: String,
    default: null,
    trim: true
  },
  color: {
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
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['available', 'sold_out'],
    default: 'available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Phone', PhoneSchema);
