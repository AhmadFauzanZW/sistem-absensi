const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/logController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/logs
// Hanya bisa diakses oleh Direktur, sesuai rancangan [cite: 71, 72]
router.get('/', protect, authorize('Direktur'), getActivityLogs);

module.exports = router;