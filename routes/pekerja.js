const express = require('express');
const router = express.Router();

const { getProfileData, getAllPekerja, getPekerjaById, getAttendanceHistory } = require('../controllers/pekerjaController');
const { protect } = require('../middleware/authMiddleware');

// Endpoint untuk Halaman Absensi
router.get('/all', protect, getAllPekerja);

// Rute yang lebih SPESIFIK harus didefinisikan PERTAMA
router.get('/profil', protect, getProfileData);
router.get('/history', protect, getAttendanceHistory);

// Rute yang lebih UMUM (dinamis) didefinisikan SETELAHNYA
router.get('/:id_pekerja', protect, getPekerjaById);

module.exports = router;