const express = require('express');
const router = express.Router();
const {
  sellPhone,
  sellAccessory,
  sellAccessoryItem,
  getDashboardStats,
  getReportsData
} = require('../controllers/salesController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // protect all sales routes

router.post('/phone', sellPhone);
router.post('/accessory', sellAccessory);
router.post('/accessory-item', sellAccessoryItem);
router.get('/dashboard', getDashboardStats);
router.get('/reports', getReportsData);

module.exports = router;
