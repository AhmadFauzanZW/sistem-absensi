const express = require('express');
const router = express.Router();
const { getSupervisorSummary } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET /api/dashboard/summary
// Rute ini dilindungi oleh 'protect' dan hanya bisa diakses oleh Supervisor, Manager, Direktur [cite: 38, 221]
router.get('/summary', protect, authorize('Supervisor', 'Manager', 'Direktur'), getSupervisorSummary);

module.exports = router;