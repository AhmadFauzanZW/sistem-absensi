// server/routes/kehadiran.js

const express = require('express');
const router = express.Router();
const { getCatatanKehadiran } = require('../controllers/kehadiranController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/kehadiran
router.get('/', protect, getCatatanKehadiran);

module.exports = router;