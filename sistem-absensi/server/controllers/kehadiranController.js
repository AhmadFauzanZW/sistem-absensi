const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

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
                DATE_FORMAT(ck.waktu_clock_out, '%H:%i:%s') as jam_pulang,
                ck.status_kehadiran
            FROM catatan_kehadiran ck
                    JOIN pekerja pk ON ck.id_pekerja = pk.id_pekerja
                    JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
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
                    LEFT JOIN catatan_kehadiran ck ON pk.id_pekerja = ck.id_pekerja
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

exports.catatKehadiran = async (req, res) => {
    const { id_pekerja, tipe_aksi, metode, fotoB64, id_lokasi } = req.body;

    if (!id_pekerja || !tipe_aksi) {
        return res.status(400).json({ message: 'ID Pekerja dan Tipe Aksi diperlukan.' });
    }

    try {
        const [pekerjaRows] = await pool.query('SELECT id_pengguna FROM pekerja WHERE id_pekerja = ?', [id_pekerja]);
        if (pekerjaRows.length === 0) return res.status(404).json({ message: 'Data pekerja tidak ditemukan.' });

        // --- PERBAIKAN BUG: Validasi Jam Kerja untuk Clock-In ---
        if (tipe_aksi === 'clock_in') {
            const sekarang = new Date();
            const jamSekarang = sekarang.getHours();

            // Batasi clock-in hanya bisa dilakukan antara jam 5 pagi hingga 4 sore.
            if (jamSekarang < 7 || jamSekarang >= 16) {
                return res.status(400).json({ message: 'Tidak bisa melakukan clock-in di luar jam kerja (07:00 - 16:00).' });
            }

            // Cek apakah sudah ada clock_in untuk hari ini
            const [existingClockIn] = await pool.query(
                'SELECT id_kehadiran FROM catatan_kehadiran WHERE id_pekerja = ? AND DATE(waktu_clock_in) = CURDATE()',
                [id_pekerja]
            );
            if (existingClockIn.length > 0) {
                return res.status(400).json({ message: 'Anda sudah melakukan clock-in hari ini.' });
            }
            // --- AKHIR PERBAIKAN ---

            let namaFileFoto = null;
            if (fotoB64) {
                const bagianData = fotoB64.split(';base64,');
                const tipeGambar = bagianData[0].split('/')[1];
                const dataGambar = bagianData[1];
                namaFileFoto = `${Date.now()}-clockin-${id_pekerja}.${tipeGambar}`;
                const folderPath = path.join(__dirname, '..', 'public', 'uploads', 'kehadiran');
                if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
                const filePath = path.join(folderPath, namaFileFoto);
                fs.writeFileSync(filePath, dataGambar, { encoding: 'base64' });
            }

            const batasWaktu = new Date();
            batasWaktu.setHours(8, 5, 0, 0);
            const status_kehadiran = sekarang > batasWaktu ? 'Telat' : 'Hadir';

            const query = `
                INSERT INTO catatan_kehadiran (id_pekerja, waktu_clock_in, status_kehadiran, metode_verifikasi, foto_clock_in_path, id_lokasi)
                VALUES (?, NOW(), ?, ?, ?, ?)`;
            await pool.query(query, [id_pekerja, status_kehadiran, metode, namaFileFoto, id_lokasi]);
            res.status(201).json({ message: 'Clock-In berhasil dicatat!' });

        } else if (tipe_aksi === 'clock_out') {
            const [clockInRecord] = await pool.query(
                `SELECT waktu_clock_in, status_kehadiran FROM catatan_kehadiran 
         WHERE id_pekerja = ? AND DATE(waktu_clock_in) = CURDATE() AND waktu_clock_out IS NULL 
         ORDER BY waktu_clock_in DESC LIMIT 1`, [id_pekerja]
            );

            if (clockInRecord.length === 0) {
                return res.status(404).json({ message: 'Tidak ditemukan data Clock-In untuk di-Clock-Out.' });
            }

            const waktuMasuk = new Date(clockInRecord[0].waktu_clock_in);
            const waktuPulang = new Date();

            // Hitung total durasi kerja dalam menit
            const durasiMenit = (waktuPulang - waktuMasuk) / (1000 * 60);
            const standarDurasiKerjaNormal = 8 * 60; // 8 jam kerja
            const standarDurasiKerjaPenuh = 9 * 60;  // 9 jam (termasuk 1 jam istirahat)

            let status_pulang = clockInRecord[0].status_kehadiran; // Status default = status saat masuk
            if (durasiMenit > standarDurasiKerjaPenuh) {
                status_pulang = 'Lembur';
            } else if (durasiMenit < standarDurasiKerjaNormal) {
                status_pulang = 'Pulang Cepat';
            }

            const updateQuery = `
                UPDATE catatan_kehadiran SET waktu_clock_out = NOW(), status_kehadiran = ?
                WHERE id_pekerja = ? AND DATE(waktu_clock_in) = CURDATE() AND waktu_clock_out IS NULL
                ORDER BY waktu_clock_in DESC LIMIT 1`;

            await pool.query(updateQuery, [status_pulang, id_pekerja]);
            res.status(200).json({ message: 'Clock-Out berhasil dicatat!' });
        }
    } catch (error) {
        console.error("Error saat mencatat kehadiran:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};