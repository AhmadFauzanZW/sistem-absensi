const express = require('express');
const router = express.Router();
const { getLokasiProyek } = require('../controllers/proyekController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/proyek/lokasi
router.get('/lokasi', protect, getLokasiProyek);

module.exports = router;