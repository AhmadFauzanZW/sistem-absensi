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
        COUNT(CASE WHEN status_kehadiran = 'Telat' THEN 1 END) AS terlambat
      FROM catatan_kehadiran
      ${whereClause}
    `;

        const [summary] = await pool.query(query);

        // Hitung absen (total pekerja - yang hadir pada periode filter)
        const totalHadirDanTelat = parseInt(summary[0].hadir) + parseInt(summary[0].terlambat);
        const absen = parseInt(summary[0].total_pekerja) - totalHadirDanTelat;

        res.json({ ...summary[0], absen });

    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};