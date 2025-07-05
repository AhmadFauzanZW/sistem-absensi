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

exports.getAbsensiMingguan = async (req, res) => {
    try {
        // Ambil tanggal dari query, jika tidak ada, gunakan tanggal hari ini
        const tanggalPilihan = req.query.tanggal || new Date().toISOString().slice(0, 10);

        // Query ini akan melakukan 'PIVOT' data kehadiran
        // dari format baris menjadi format kolom per hari untuk satu minggu.
        const query = `
            SELECT
                pk.id_pekerja,
                p.nama_pengguna AS nama_lengkap,
                jpk.nama_pekerjaan,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 2 THEN ck.status_kehadiran END), 'N/A') AS Senin,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 3 THEN ck.status_kehadiran END), 'N/A') AS Selasa,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 4 THEN ck.status_kehadiran END), 'N/A') AS Rabu,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 5 THEN ck.status_kehadiran END), 'N/A') AS Kamis,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 6 THEN ck.status_kehadiran END), 'N/A') AS Jumat,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 7 THEN ck.status_kehadiran END), 'N/A') AS Sabtu,
                COALESCE(MAX(CASE WHEN DAYOFWEEK(ck.waktu_clock_in) = 1 THEN ck.status_kehadiran END), 'N/A') AS Minggu
            FROM
                pekerja pk
            JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
            LEFT JOIN jenis_pekerjaan jpk ON pk.id_jenis_pekerjaan = jpk.id_jenis_pekerjaan
            LEFT JOIN
                catatan_kehadiran ck ON pk.id_pekerja = ck.id_pekerja
                    AND YEARWEEK(ck.waktu_clock_in, 1) = YEARWEEK(?, 1) -- filter berdasarkan minggu dari tanggal yang dipilih
            GROUP BY
                pk.id_pekerja, -- <-- PERBAIKAN DI SINI (p.id_pekerja -> pk.id_pekerja)
                p.nama_pengguna,
                jpk.nama_pekerjaan
            ORDER BY
                p.nama_pengguna;
        `;

        const [pekerjaList] = await pool.query(query, [tanggalPilihan]);
        res.json(pekerjaList);

    } catch (error) {
        console.error("Gagal mengambil absensi mingguan:", error);
        res.status(500).send("Server Error");
    }
};