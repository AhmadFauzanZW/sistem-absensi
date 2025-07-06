// server/routes/kehadiran.js

const express = require('express');
const router = express.Router();
const { getCatatanKehadiran, getAbsensiMingguan, catatKehadiran } = require('../controllers/kehadiranController');
const { protect } = require('../middleware/authMiddleware');

// GET /api/kehadiran
router.get('/', protect, getCatatanKehadiran);

// GET /api/kehadiran/mingguan
router.get('/mingguan', protect, getAbsensiMingguan);

// POST /api/kehadiran/catat
router.post('/catat', protect, catatKehadiran);


module.exports = router;