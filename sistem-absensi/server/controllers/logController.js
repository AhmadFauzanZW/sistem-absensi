const pool = require('../config/db');

exports.getActivityLogs = async (req, res) => {
    try {
        const [logs] = await pool.query(
            `SELECT l.waktu_aktivitas, p.nama_pengguna, pr.nama_peran, l.tipe_aktivitas, l.deskripsi
       FROM log_aktivitas l
       JOIN pengguna p ON l.id_pengguna = p.id_pengguna
       JOIN peran pr ON p.id_peran = pr.id_peran
       ORDER BY l.waktu_aktivitas DESC
       LIMIT 50` // Batasi jumlah log yang diambil
        );
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};