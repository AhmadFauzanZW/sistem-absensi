// server/controllers/kehadiranController.js

const pool = require('../config/db');

exports.getCatatanKehadiran = async (req, res) => {
    try {
        const filter = req.query.filter || 'hari';
        let whereClause = '';

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

        // Query untuk mengambil detail catatan kehadiran dengan JOIN ke tabel Pekerja
        const query = `
      SELECT 
        ck.id_kehadiran,
        p.nama_pengguna,
        DATE_FORMAT(ck.waktu_clock_in, '%Y-%m-%d') as tanggal,
        DATE_FORMAT(ck.waktu_clock_in, '%H:%i:%s') as jam_masuk,
        ck.status_kehadiran
      FROM catatan_kehadiran ck
      JOIN pengguna p ON ck.id_pengguna = p.id_pengguna
      ${whereClause}
      ORDER BY ck.waktu_clock_in DESC
    `;

        const [records] = await pool.query(query);
        res.json(records);

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};