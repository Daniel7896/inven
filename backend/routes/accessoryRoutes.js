const express = require('express');
const router = express.Router();
const {
  getCategories,
  addCategory,
  deleteCategory,
  getInventory,
  addInventoryItem,
  deleteInventoryItem
} = require('../controllers/accessoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all routes

// Categories routes
router.route('/categories')
  .get(getCategories)
  .post(addCategory);

router.route('/categories/:id')
  .delete(deleteCategory);

// Inventory routes
router.route('/inventory')
  .get(getInventory)
  .post(addInventoryItem);

router.route('/inventory/:id')
  .delete(deleteInventoryItem);

module.exports = router;
