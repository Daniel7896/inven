const express = require('express');
const router = express.Router();
const {
  getInventory,
  getPhoneById,
  addPhone,
  updatePhone,
  deletePhone
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all inventory endpoints

router.route('/')
  .get(getInventory)
  .post(addPhone);

router.route('/:id')
  .get(getPhoneById)
  .put(updatePhone)
  .delete(deletePhone);

module.exports = router;
