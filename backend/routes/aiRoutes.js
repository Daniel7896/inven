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
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.use(protect); // protect scan routes

// POST /api/ai/scan
router.post('/scan', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, scanPhoneBox);

module.exports = router;
