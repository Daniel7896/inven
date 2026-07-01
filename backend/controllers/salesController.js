const Sale = require('../models/Sale');
const Phone = require('../models/Phone');
const User = require('../models/User');
const AccessoryItem = require('../models/AccessoryItem');

// Helper to get date ranges
const getDateRanges = () => {
  const now = new Date();
  
  // Today (Start of today to end of today)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // This Week (Monday to Sunday)
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Restore now date
  const nowRestored = new Date();

  // This Month
  const startOfMonth = new Date(nowRestored.getFullYear(), nowRestored.getMonth(), 1);
  const endOfMonth = new Date(nowRestored.getFullYear(), nowRestored.getMonth() + 1, 0, 23, 59, 59, 999);

  // This Year
  const startOfYear = new Date(nowRestored.getFullYear(), 0, 1);
  const endOfYear = new Date(nowRestored.getFullYear(), 11, 31, 23, 59, 59, 999);

  return {
    today: { start: startOfToday, end: endOfToday },
    week: { start: startOfWeek, end: endOfWeek },
    month: { start: startOfMonth, end: endOfMonth },
    year: { start: startOfYear, end: endOfYear }
  };
};

// @desc    Sell a phone (decrement stock and log sale)
// @route   POST /api/sales/phone
// @access  Private
const sellPhone = async (req, res) => {
  try {
    const { phoneId, sellingPrice, paymentMethod, customerName, customerPhone, date } = req.body;

    if (!phoneId || sellingPrice === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'Phone ID, Selling Price and Payment Method are required' });
    }

    const phone = await Phone.findOne({ _id: phoneId, user: req.user._id });

    if (!phone) {
      return res.status(404).json({ message: 'Phone not found in inventory' });
    }

    if (phone.quantity <= 0) {
      return res.status(400).json({ message: 'Phone is out of stock' });
    }

    // Decrement stock
    phone.quantity -= 1;
    if (phone.quantity === 0) {
      phone.status = 'sold_out';
    }
    await phone.save();

    // Log transaction in unified Sale collection
    const sale = await Sale.create({
      user: req.user._id,
      type: 'phone',
      category: null,
      itemRef: phone._id,
      costPrice: phone.purchasePrice,
      sellingPrice,
      paymentMethod,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      date: date || new Date()
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Quick-sell accessory (log sale in unified collection, no stock tracking)
// @route   POST /api/sales/accessory
// @access  Private
const sellAccessory = async (req, res) => {
  try {
    const { category, costPrice, sellingPrice, paymentMethod, customerName, customerPhone, date } = req.body;

    if (!category || costPrice === undefined || sellingPrice === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'Category, Cost Price, Selling Price and Payment Method are required' });
    }

    // Log transaction in unified Sale collection
    const sale = await Sale.create({
      user: req.user._id,
      type: 'accessory',
      category,
      itemRef: null,
      costPrice,
      sellingPrice,
      paymentMethod,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      date: date || new Date()
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard metrics and low stock alerts
// @route   GET /api/sales/dashboard
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const ranges = getDateRanges();
    const userId = req.user._id;

    // Aggregation helper for sum of revenue & profit in a date range
    const getStatsForRange = async (start, end) => {
      const matchStage = {
        user: userId,
        date: { $gte: start, $lte: end }
      };

      const result = await Sale.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$sellingPrice' },
            profit: { $sum: '$profit' },
            phoneRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'phone'] }, '$sellingPrice', 0] }
            },
            phoneProfit: {
              $sum: { $cond: [{ $eq: ['$type', 'phone'] }, '$profit', 0] }
            },
            accessoryRevenue: {
              $sum: { $cond: [{ $eq: ['$type', 'accessory'] }, '$sellingPrice', 0] }
            },
            accessoryProfit: {
              $sum: { $cond: [{ $eq: ['$type', 'accessory'] }, '$profit', 0] }
            }
          }
        }
      ]);

      return result[0] || {
        revenue: 0, profit: 0,
        phoneRevenue: 0, phoneProfit: 0,
        accessoryRevenue: 0, accessoryProfit: 0
      };
    };

    // Calculate periods
    const todayStats = await getStatsForRange(ranges.today.start, ranges.today.end);
    const weekStats = await getStatsForRange(ranges.week.start, ranges.week.end);
    const monthStats = await getStatsForRange(ranges.month.start, ranges.month.end);
    const yearStats = await getStatsForRange(ranges.year.start, ranges.year.end);

    // Stock indicators
    const totalInventoryCount = await Phone.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const phoneStock = totalInventoryCount[0]?.total || 0;

    const totalAccCount = await AccessoryItem.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const accStock = totalAccCount[0]?.total || 0;

    const totalStock = phoneStock + accStock;

    const availableStockCount = await Phone.countDocuments({
      user: userId,
      quantity: { $gt: 0 }
    });

    const availableAccCount = await AccessoryItem.countDocuments({
      user: userId,
      quantity: { $gt: 0 }
    });

    const uniqueAvailableModels = availableStockCount + availableAccCount;

    // Low stock threshold
    const lowStockThreshold = req.user.settings?.lowStockThreshold || 5;
    const phoneAlerts = await Phone.find({
      user: userId,
      quantity: { $lte: lowStockThreshold, $gt: 0 }
    }).sort({ quantity: 1 });

    const accAlerts = await AccessoryItem.find({
      user: userId,
      quantity: { $lte: lowStockThreshold, $gt: 0 }
    }).sort({ quantity: 1 });

    const lowStockAlerts = [
      ...phoneAlerts.map(p => ({
        _id: p._id,
        brand: p.brand,
        model: p.model,
        quantity: p.quantity,
        variant: p.variant || ''
      })),
      ...accAlerts.map(a => ({
        _id: a._id,
        brand: a.brand,
        model: `${a.category}${a.modelCompatibility ? ` (${a.modelCompatibility})` : ''}`,
        quantity: a.quantity,
        variant: 'Accessory'
      }))
    ].sort((a, b) => a.quantity - b.quantity);

    // Phones sold today
    const phonesSoldToday = await Sale.countDocuments({
      user: userId,
      type: 'phone',
      date: { $gte: ranges.today.start, $lte: ranges.today.end }
    });

    res.status(200).json({
      today: todayStats,
      week: weekStats,
      month: monthStats,
      year: yearStats,
      stock: {
        totalStock,
        uniqueAvailableModels,
        lowStockAlerts
      },
      phonesSoldTodayCount: phonesSoldToday
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reports data (Charts & Tables: daily/monthly revenue lists, top phones, top accessories)
// @route   GET /api/sales/reports
// @access  Private
const getReportsData = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Default time range is last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Let's parse custom query dates if available
    const { start, end } = req.query;
    const customStart = start ? new Date(start) : startDate;
    const customEnd = end ? new Date(end) : endDate;
    customEnd.setHours(23, 59, 59, 999);

    // 1. Unified Sales List
    const salesList = await Sale.find({
      user: userId,
      date: { $gte: customStart, $lte: customEnd }
    })
    .populate('itemRef', 'brand model variant color')
    .sort({ date: -1 });

    // 2. Daily Sales Data (for line chart) - last 15 days or custom range
    const dailyData = await Sale.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: customStart, $lte: customEnd }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Monthly Sales Data (for bar chart) - past year
    const startOfPastYear = new Date();
    startOfPastYear.setMonth(startOfPastYear.getMonth() - 11);
    startOfPastYear.setDate(1);
    startOfPastYear.setHours(0, 0, 0, 0);

    const monthlyData = await Sale.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startOfPastYear }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. Best Selling Phone Models (aggregated brand+model)
    const bestSellingPhones = await Sale.aggregate([
      {
        $match: {
          user: userId,
          type: 'phone',
          date: { $gte: customStart, $lte: customEnd }
        }
      },
      {
        $lookup: {
          from: 'phones',
          localField: 'itemRef',
          foreignField: '_id',
          as: 'phoneDetails'
        }
      },
      { $unwind: '$phoneDetails' },
      {
        $group: {
          _id: {
            brand: '$phoneDetails.brand',
            model: '$phoneDetails.model'
          },
          salesCount: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: 10 }
    ]);

    // 5. Top Accessory Categories
    const topAccessories = await Sale.aggregate([
      {
        $match: {
          user: userId,
          type: 'accessory',
          date: { $gte: customStart, $lte: customEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          salesCount: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      sales: salesList,
      dailyChart: dailyData,
      monthlyChart: monthlyData,
      bestSellers: bestSellingPhones,
      topAccessories: topAccessories
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell an accessory item from inventory (decrement stock and log sale)
// @route   POST /api/sales/accessory-item
// @access  Private
const sellAccessoryItem = async (req, res) => {
  try {
    const { accessoryItemId, sellingPrice, paymentMethod, customerName, customerPhone, date } = req.body;

    if (!accessoryItemId || sellingPrice === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'Accessory Item ID, Selling Price and Payment Method are required' });
    }

    const item = await AccessoryItem.findOne({ _id: accessoryItemId, user: req.user._id });

    if (!item) {
      return res.status(404).json({ message: 'Accessory item not found in stock' });
    }

    if (item.quantity <= 0) {
      return res.status(400).json({ message: 'Accessory item is out of stock' });
    }

    // Decrement stock
    item.quantity -= 1;
    if (item.quantity === 0) {
      item.status = 'sold_out';
    }
    await item.save();

    // Log transaction in unified Sale collection
    const categoryLabel = item.modelCompatibility 
      ? `${item.category} (${item.brand} - ${item.modelCompatibility})` 
      : `${item.category} (${item.brand})`;

    const sale = await Sale.create({
      user: req.user._id,
      type: 'accessory',
      category: categoryLabel,
      itemRef: null,
      costPrice: item.purchasePrice,
      sellingPrice,
      paymentMethod,
      customerName: customerName || null,
      customerPhone: customerPhone || null,
      date: date || new Date()
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sellPhone,
  sellAccessory,
  sellAccessoryItem,
  getDashboardStats,
  getReportsData
};
