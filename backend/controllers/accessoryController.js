const AccessoryCategory = require('../models/AccessoryCategory');

// @desc    Get all accessory categories for a user
// @route   GET /api/accessories/categories
// @access  Private
const getCategories = async (req, res) => {
  try {
    const categories = await AccessoryCategory.find({ user: req.user._id }).sort({ isCustom: 1, name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a custom accessory category
// @route   POST /api/accessories/categories
// @access  Private
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const cleanName = name.trim();

    // Check if category exists for user (case insensitive)
    const exists = await AccessoryCategory.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
    });

    if (exists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await AccessoryCategory.create({
      user: req.user._id,
      name: cleanName,
      isCustom: true
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete custom accessory category
// @route   DELETE /api/accessories/categories/:id
// @access  Private
const deleteCategory = async (req, res) => {
  try {
    const category = await AccessoryCategory.findOne({ _id: req.params.id, user: req.user._id });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!category.isCustom) {
      return res.status(400).json({ message: 'Cannot delete default category' });
    }

    await AccessoryCategory.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const AccessoryItem = require('../models/AccessoryItem');

// @desc    Get all inventory accessory items
// @route   GET /api/accessories/inventory
// @access  Private
const getInventory = async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { user: req.user._id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { modelCompatibility: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await AccessoryItem.find(query).sort({ updatedAt: -1 });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add or restock accessory item
// @route   POST /api/accessories/inventory
// @access  Private
const addInventoryItem = async (req, res) => {
  try {
    const { category, brand, modelCompatibility, purchasePrice, sellingPrice, supplier, quantityToAdd } = req.body;

    if (!category || !brand || !purchasePrice) {
      return res.status(400).json({ message: 'Category, Brand/Company, and Purchase Price are required' });
    }

    const qty = parseInt(quantityToAdd, 10) || 1;

    // Check if item already exists for user with same specifications
    let item = await AccessoryItem.findOne({
      user: req.user._id,
      category: category.trim(),
      brand: brand.trim(),
      modelCompatibility: modelCompatibility ? modelCompatibility.trim() : null
    });

    if (item) {
      // Update existing item
      item.quantity += qty;
      item.purchasePrice = parseFloat(purchasePrice);
      if (sellingPrice) item.sellingPrice = parseFloat(sellingPrice);
      if (supplier) item.supplier = supplier.trim();
      item.status = item.quantity > 0 ? 'available' : 'sold_out';
      await item.save();
    } else {
      // Create new item
      item = await AccessoryItem.create({
        user: req.user._id,
        category: category.trim(),
        brand: brand.trim(),
        modelCompatibility: modelCompatibility ? modelCompatibility.trim() : null,
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        supplier: supplier ? supplier.trim() : null,
        quantity: qty,
        status: qty > 0 ? 'available' : 'sold_out'
      });
    }

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete accessory item from stock
// @route   DELETE /api/accessories/inventory/:id
// @access  Private
const deleteInventoryItem = async (req, res) => {
  try {
    const item = await AccessoryItem.findOne({ _id: req.params.id, user: req.user._id });

    if (!item) {
      return res.status(404).json({ message: 'Accessory item not found' });
    }

    await AccessoryItem.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Accessory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCategories,
  addCategory,
  deleteCategory,
  getInventory,
  addInventoryItem,
  deleteInventoryItem
};
