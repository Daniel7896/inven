const Phone = require('../models/Phone');

// @desc    Get all phones (with search and status filters)
// @route   GET /api/inventory
// @access  Private
const getInventory = async (req, res) => {
  try {
    const { search, status } = req.query;
    let query = { user: req.user._id };

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { brand: searchRegex },
        { model: searchRegex },
        { variant: searchRegex },
        { color: searchRegex }
      ];
    }

    const phones = await Phone.find(query).sort({ updatedAt: -1 });
    res.status(200).json(phones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single phone details
// @route   GET /api/inventory/:id
// @access  Private
const getPhoneById = async (req, res) => {
  try {
    const phone = await Phone.findOne({ _id: req.params.id, user: req.user._id });
    if (!phone) {
      return res.status(404).json({ message: 'Phone not found' });
    }
    res.status(200).json(phone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a phone to inventory (deduplicates and increments quantity if spec matches)
// @route   POST /api/inventory
// @access  Private
const addPhone = async (req, res) => {
  try {
    const {
      brand,
      model,
      variant,
      ram,
      storage,
      color,
      purchasePrice,
      sellingPrice,
      supplier,
      purchaseDate,
      quantityToAdd
    } = req.body;

    if (!brand || !model || purchasePrice === undefined) {
      return res.status(400).json({ message: 'Brand, Model and Purchase Price are required' });
    }

    // Clean spec fields to handle nulls consistently
    const spec = {
      user: req.user._id,
      brand: brand.trim(),
      model: model.trim(),
      variant: variant ? variant.trim() : null,
      ram: ram ? ram.trim() : null,
      storage: storage ? storage.trim() : null,
      color: color ? color.trim() : null
    };

    const addCount = Number(quantityToAdd) || 1;

    // Check for match
    let phone = await Phone.findOne(spec);

    if (phone) {
      // Increment quantity
      phone.quantity += addCount;
      if (phone.quantity > 0) {
        phone.status = 'available';
      }
      
      // Update price details if provided
      if (purchasePrice !== undefined) phone.purchasePrice = purchasePrice;
      if (sellingPrice !== undefined) phone.sellingPrice = sellingPrice;
      if (supplier) phone.supplier = supplier;
      if (purchaseDate) phone.purchaseDate = purchaseDate;

      await phone.save();
      res.status(200).json({ message: 'Inventory updated successfully', phone });
    } else {
      // Create new
      phone = await Phone.create({
        ...spec,
        quantity: addCount,
        purchasePrice,
        sellingPrice: sellingPrice || null,
        supplier: supplier || null,
        purchaseDate: purchaseDate || Date.now(),
        status: addCount > 0 ? 'available' : 'sold_out'
      });
      res.status(201).json({ message: 'New inventory item created', phone });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update physical stock parameters manually
// @route   PUT /api/inventory/:id
// @access  Private
const updatePhone = async (req, res) => {
  try {
    const phone = await Phone.findOne({ _id: req.params.id, user: req.user._id });

    if (!phone) {
      return res.status(404).json({ message: 'Phone item not found' });
    }

    const fieldsToUpdate = [
      'brand', 'model', 'variant', 'ram', 'storage', 'color',
      'quantity', 'purchasePrice', 'sellingPrice', 'supplier',
      'purchaseDate', 'status'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        phone[field] = req.body[field];
      }
    });

    // Automatically set status based on quantity
    if (phone.quantity === 0) {
      phone.status = 'sold_out';
    } else if (phone.quantity > 0 && phone.status === 'sold_out') {
      phone.status = 'available';
    }

    await phone.save();
    res.status(200).json(phone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete phone entry
// @route   DELETE /api/inventory/:id
// @access  Private
const deletePhone = async (req, res) => {
  try {
    const result = await Phone.deleteOne({ _id: req.params.id, user: req.user._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Phone item not found' });
    }
    res.status(200).json({ message: 'Phone item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventory,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone
};
