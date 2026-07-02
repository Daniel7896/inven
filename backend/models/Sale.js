const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['phone', 'accessory'],
    required: true
  },
  category: {
    type: String,
    default: null // e.g. "Charger" - null for phone sales
  },
  itemRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Phone',
    default: null // null for accessory sales
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    required: true,
    default: 0
  },
  paymentMethod: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    default: null
  },
  customerPhone: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-calculate profit before saving
SaleSchema.pre('save', function(next) {
  this.profit = this.sellingPrice - this.costPrice;
  next();
});

// Performance indexes
SaleSchema.index({ user: 1, date: -1 });
SaleSchema.index({ user: 1, type: 1, date: -1 });

module.exports = mongoose.model('Sale', SaleSchema);
