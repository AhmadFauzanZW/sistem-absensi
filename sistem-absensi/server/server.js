const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Scheduler
require('./services/cronService');

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/kehadiran', require('./routes/kehadiran'));
app.use('/api/logs', require('./routes/log'));
app.use('/api/izin', require('./routes/izin'));
app.use('/api/proyek', require('./routes/proyek'));
app.use('/api/pekerja', require('./routes/pekerja'));
// Add other routes here later

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`Server started on port ${PORT}`);
});