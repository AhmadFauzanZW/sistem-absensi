// server/controllers/dashboardController.js

const pool = require('../config/db');

exports.getSupervisorSummary = async (req, res) => {
    try {
        // Ambil nilai filter dari query string, defaultnya adalah 'hari'
        const filter = req.query.filter || 'hari';

        let whereClause = '';

        // Tentukan klausa WHERE berdasarkan filter yang dipilih
        switch (filter) {
            case 'minggu':
                // Mengambil data untuk minggu ini (Senin-Minggu)
                whereClause = 'WHERE YEARWEEK(waktu_clock_in, 1) = YEARWEEK(CURDATE(), 1)';
                break;
            case 'bulan':
                // Mengambil data untuk bulan ini
                whereClause = 'WHERE MONTH(waktu_clock_in) = MONTH(CURDATE()) AND YEAR(waktu_clock_in) = YEAR(CURDATE())';
                break;
            case 'hari':
            default:
                // Mengambil data untuk hari ini
                whereClause = 'WHERE DATE(waktu_clock_in) = CURDATE()';
                break;
        }

        // Query untuk mengambil ringkasan data kehadiran dengan filter dinamis
        const query = `
      SELECT 
        (SELECT COUNT(*) FROM pekerja) AS total_pekerja,
        COUNT(CASE WHEN status_kehadiran = 'Hadir' THEN 1 END) AS hadir,
        COUNT(CASE WHEN status_kehadiran = 'Telat' THEN 1 END) AS terlambat,
        COUNT(CASE WHEN status_kehadiran = 'Izin' THEN 1 END) AS izin,
        COUNT(CASE WHEN status_kehadiran = 'Lembur' THEN 1 END) AS lembur,
        COUNT(CASE WHEN status_kehadiran = 'Pulang Cepat' THEN 1 END) AS pulang_cepat
      FROM catatan_kehadiran
      ${whereClause}
    `;

        const [summary] = await pool.query(query);

        // Hitung absen (total pekerja - yang hadir pada periode filter)
        const totalHadir = parseInt(summary[0].hadir) + parseInt(summary[0].terlambat) + parseInt(summary[0].izin) + parseInt(summary[0].lembur) + parseInt(summary[0].pulang_cepat);
        const absen = parseInt(summary[0].total_pekerja) - totalHadir;

        res.json({ ...summary[0], absen });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

exports.getRecentActivities = async (req, res) => {
    try {
        // Ambil parameter untuk filter dan pagination
        const { filter, page = 1, limit = 10 } = req.query; // Default 10 item per halaman
        const offset = (page - 1) * limit;

        let whereClause = '';

        // Tentukan klausa WHERE berdasarkan filter
        switch (filter) {
            case 'minggu':
                whereClause = 'WHERE YEARWEEK(ck.waktu_clock_in, 1) = YEARWEEK(CURDATE(), 1)';
                break;
            case 'bulan':
                whereClause = 'WHERE MONTH(ck.waktu_clock_in) = MONTH(CURDATE()) AND YEAR(ck.waktu_clock_in) = YEAR(CURDATE())';
                break;
            case 'hari':
            default:
                whereClause = 'WHERE DATE(ck.waktu_clock_in) = CURDATE()';
                break;
        }

        // Query untuk mengambil total data untuk pagination
        const countQuery = `SELECT COUNT(*) as total FROM catatan_kehadiran ck ${whereClause}`;
        const [totalResult] = await pool.query(countQuery);
        const totalItems = totalResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query untuk mengambil daftar aktivitas dengan JOIN ke tabel pengguna dan pagination
        const activityQuery = `
            SELECT
                p.nama_pengguna,
                DATE_FORMAT(ck.waktu_clock_in, '%Y-%m-%d') as tanggal,
                DATE_FORMAT(ck.waktu_clock_in, '%H:%i:%s') as jam_masuk,
                DATE_FORMAT(ck.waktu_clock_out, '%H:%i:%s') as jam_pulang,
                ck.status_kehadiran
            FROM catatan_kehadiran ck
            JOIN pengguna p ON ck.id_pengguna = p.id_pengguna
            ${whereClause}
            ORDER BY ck.waktu_clock_in DESC
            LIMIT ?
            OFFSET ?
        `;

        const [activities] = await pool.query(activityQuery, [parseInt(limit), parseInt(offset)]);

        res.json({
            activities,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems
            }
        });

    } catch (error) {
        console.error("Error fetching recent activities:", error);
        res.status(500).send('Server Error');
    }
};