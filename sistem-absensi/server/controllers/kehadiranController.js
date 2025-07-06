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

exports.catatKehadiran = async (req, res) => {
    const { id_pekerja, tipe_aksi, metode, fotoB64, id_lokasi } = req.body;

    if (!id_pekerja || !tipe_aksi) {
        return res.status(400).json({ message: 'ID Pekerja dan Tipe Aksi diperlukan.' });
    }

    try {
        // --- LANGKAH TAMBAHAN: Dapatkan id_pengguna dari id_pekerja ---
        const [pekerjaRows] = await pool.query('SELECT id_pengguna FROM pekerja WHERE id_pekerja = ?', [id_pekerja]);

        if (pekerjaRows.length === 0) {
            return res.status(404).json({ message: 'Data pekerja tidak ditemukan.' });
        }
        const id_pengguna = pekerjaRows[0].id_pengguna;
        // -----------------------------------------------------------------

        // Logika penyimpanan file foto (dari solusi sebelumnya)
        let namaFileFoto = null;
        if (fotoB64 && tipe_aksi === 'clock_in') {
            const bagianData = fotoB64.split(';base64,');
            const tipeGambar = bagianData[0].split('/')[1];
            const dataGambar = bagianData[1];
            namaFileFoto = `${Date.now()}-clockin-${id_pekerja}.${tipeGambar}`;
            const folderPath = path.join(__dirname, '..', 'public', 'uploads', 'kehadiran');
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true });
            }
            const filePath = path.join(folderPath, namaFileFoto);
            fs.writeFileSync(filePath, dataGambar, { encoding: 'base64' });
        }

        if (tipe_aksi === 'clock_in') {
            const jamMasuk = new Date();
            const batasWaktu = new Date();
            batasWaktu.setHours(8, 0, 0, 0); // Batas waktu jam 08:00:00

            const status_kehadiran = jamMasuk > batasWaktu ? 'Telat' : 'Hadir';

            // --- Kueri INSERT sekarang menyertakan id_pengguna ---
            const query = `
                INSERT INTO catatan_kehadiran
                (id_pekerja, id_pengguna, waktu_clock_in, status_kehadiran, metode_verifikasi, foto_clock_in_path, id_lokasi)
                VALUES (?, ?, NOW(), ?, ?, ?, ?)
            `;
            await pool.query(query, [id_pekerja, id_pengguna, status_kehadiran, metode, namaFileFoto, id_lokasi]);
            res.status(201).json({ message: 'Clock-In berhasil dicatat!' });

        } else if (tipe_aksi === 'clock_out') {
            const jamPulang = new Date();
            const batasWaktuNormal = new Date();
            batasWaktuNormal.setHours(16, 0, 0, 0); // Batas waktu normal jam 16:00

            const batasWaktuLembur = new Date(batasWaktuNormal.getTime() + 30 * 60000); // 16:30
            const batasWaktuPulangCepat = new Date(batasWaktuNormal.getTime() - 30 * 60000); // 15:30

            let status_kehadiran;
            if (jamPulang > batasWaktuLembur) {
                status_kehadiran = 'Lembur';
            } else if (jamPulang < batasWaktuPulangCepat) {
                status_kehadiran = 'Pulang Cepat';
            } else {
                status_kehadiran = 'Hadir';
            }

            const findQuery = `
                UPDATE catatan_kehadiran
                SET waktu_clock_out = NOW(), status_kehadiran = ?
                WHERE id_pekerja = ? AND DATE(waktu_clock_in) = CURDATE() AND waktu_clock_out IS NULL
                ORDER BY waktu_clock_in DESC LIMIT 1
            `;
            const [result] = await pool.query(findQuery, [status_kehadiran, id_pekerja]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Tidak ditemukan data Clock-In untuk hari ini.' });
            }
            res.status(200).json({ message: 'Clock-Out berhasil dicatat!' });
        }

    } catch (error) {
        console.error("Error saat mencatat kehadiran:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};