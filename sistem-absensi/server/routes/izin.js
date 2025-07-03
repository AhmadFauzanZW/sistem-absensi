// server/routes/izin.js
const express = require('express');
const router = express.Router();
const { ajukanIzin, getIzinUntukValidasi, prosesValidasi } = require('../controllers/izinController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../uploadConfig');

// POST /api/izin - Mengajukan izin baru
router.post('/', protect, upload.single('bukti'), ajukanIzin);

// GET /api/izin/validasi - Mendapatkan daftar izin untuk divalidasi
router.get('/validasi', protect, authorize('Supervisor', 'Manager', 'Direktur'), getIzinUntukValidasi);

// PUT /api/izin/:id_pengajuan/proses - Memproses persetujuan/penolakan
router.put('/:id_pengajuan/proses', protect, authorize('Supervisor', 'Manager', 'Direktur'), prosesValidasi);


module.exports = router;