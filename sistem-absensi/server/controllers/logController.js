const pool = require('../config/db');

exports.getActivityLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const [totalResult] = await pool.query('SELECT COUNT(*) as total FROM log_aktivitas');
        const totalItems = totalResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        const [logs] = await pool.query(
            `SELECT l.waktu_aktivitas, p.nama_pengguna, pr.nama_peran, l.tipe_aktivitas, l.deskripsi
             FROM log_aktivitas l
             JOIN pengguna p ON l.id_pengguna = p.id_pengguna
             JOIN peran pr ON p.id_peran = pr.id_peran
             ORDER BY l.waktu_aktivitas DESC
             LIMIT ? OFFSET ?`,
            [parseInt(limit), parseInt(offset)]
        );

        res.json({
            logs,
            pagination: { currentPage: parseInt(page), totalPages, totalItems }
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};