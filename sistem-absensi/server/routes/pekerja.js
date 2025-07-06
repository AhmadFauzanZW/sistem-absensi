const express = require('express');
const router = express.Router();
const { getAllPekerja, getPekerjaById } = require('../controllers/pekerjaController'); // Tambahkan getPekerjaById
const { protect } = require('../middleware/authMiddleware');

// GET /api/pekerja/all
router.get('/all', protect, getAllPekerja);

// GET /api/pekerja/by-id/:id_pekerja  <-- ROUTE BARU
router.get('/by-id/:id_pekerja', protect, getPekerjaById);

module.exports = router;