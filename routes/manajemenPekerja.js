// server/routes/manajemenPekerja.js

const express = require('express');
const router = express.Router();
const { getAllWorkers, addWorker, updateWorker, updateWorkerStatus, getMetaData } = require('../controllers/manajemenPekerjaController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Semua rute di sini hanya bisa diakses oleh Manager
router.use(protect, authorize('Manager', 'Direktur'));

router.get('/pekerja', getAllWorkers);
router.post('/pekerja', addWorker);
router.put('/pekerja/:id_pekerja', updateWorker);
router.patch('/pekerja/status/:id_pengguna', updateWorkerStatus);
router.get('/meta-data', getMetaData);

module.exports = router;