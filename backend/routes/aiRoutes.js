const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanPhoneBox } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Setup multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.use(protect); // protect scan routes

// POST /api/ai/scan
router.post('/scan', upload.single('image'), scanPhoneBox);

module.exports = router;
