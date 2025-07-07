const pool = require('../config/db');
const logActivity = require('../services/logService');

// Endpoint untuk mengajukan izin baru
exports.ajukanIzin = async (req, res) => {
    // ---- PERBAIKAN 1 ----
    // Ambil 'id' dari req.user, bukan 'id_pengguna'
    const { id: id_pengguna, role } = req.user;
    const { tanggal_mulai, tanggal_selesai, jenis_izin, keterangan } = req.body;
    const filePath = req.file ? req.file.filename : null;

    try {
        const [pekerjaRows] = await pool.query('SELECT id_pekerja FROM pekerja WHERE id_pengguna = ?', [id_pengguna]);
        if (pekerjaRows.length === 0) {
            return res.status(404).json({ message: 'Profil pekerja tidak ditemukan.' });
        }
        const id_pekerja = pekerjaRows[0].id_pekerja;

        let status_awal = '';
        if (role === 'Pekerja') status_awal = 'Menunggu Persetujuan Supervisor';
        else if (role === 'Supervisor') status_awal = 'Menunggu Persetujuan Manager';
        else if (role === 'Manager') status_awal = 'Menunggu Persetujuan Direktur';
        else {
            return res.status(400).json({ message: 'Peran tidak valid untuk mengajukan izin.' });
        }

        const [result] = await pool.query(
            'INSERT INTO pengajuan_izin (id_pekerja, tanggal_mulai, tanggal_selesai, jenis_izin, keterangan,file_bukti_path, status_akhir) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_pekerja, tanggal_mulai, tanggal_selesai, jenis_izin, keterangan, filePath, status_awal]
        );
        await logActivity(id_pengguna, 'PENGAJUAN_IZIN', `Mengajukan ${jenis_izin} dari ${tanggal_mulai} sampai ${tanggal_selesai}.`, req);

        res.status(201).json({ message: 'Pengajuan izin berhasil dibuat.', id_pengajuan: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// Endpoint untuk mengambil daftar izin yang perlu divalidasi (Sudah benar dari langkah sebelumnya)
exports.getIzinUntukValidasi = async (req, res) => {
    const { role } = req.user;
    let status_filter = [];

    if (role === 'Supervisor') {
        status_filter.push('Menunggu Persetujuan Supervisor');
    } else if (role === 'Manager') {
        status_filter.push('Disetujui Supervisor');
        status_filter.push('Menunggu Persetujuan Manager');
    } else if (role === 'Direktur') {
        status_filter.push('Menunggu Persetujuan Direktur');
    }

    if (status_filter.length === 0) {
        return res.json([]);
    }

    try {
        const query = `
            SELECT
                pi.id_pengajuan, pi.tanggal_mulai, pi.tanggal_selesai, pi.jenis_izin,
                pi.keterangan, pi.status_akhir, pi.file_bukti_path, p.nama_pengguna
            FROM pengajuan_izin pi
                     JOIN pekerja pk ON pi.id_pekerja = pk.id_pekerja
                     JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
            WHERE pi.status_akhir IN (?)
            ORDER BY pi.tanggal_pengajuan DESC
        `;
        const [izinList] = await pool.query(query, [status_filter]);
        res.json(izinList);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// FUNGSI BARU UNTUK RIWAYAT
exports.getRiwayatIzin = async (req, res) => {
    const { id: id_pengguna, role } = req.user;

    try {
        let query = '';
        let params = [];

        if (role === 'Pekerja' || role === 'Supervisor' || role === 'Manager') {
            // Pekerja, Supervisor, & Manager melihat riwayat pengajuan mereka sendiri
            const [pekerjaRows] = await pool.query('SELECT id_pekerja FROM pekerja WHERE id_pengguna = ?', [id_pengguna]);
            if (pekerjaRows.length === 0) return res.json([]);

            query = `
                SELECT pi.*, GROUP_CONCAT(CONCAT(lp.status_persetujuan, ' oleh ', p.nama_pengguna) SEPARATOR '; ') as approval_logs
                FROM pengajuan_izin pi
                    LEFT JOIN log_persetujuan_izin lp ON pi.id_pengajuan = lp.id_pengajuan
                    LEFT JOIN pengguna p ON lp.id_penyetuju = p.id_pengguna
                WHERE pi.id_pekerja = ?
                GROUP BY pi.id_pengajuan
                ORDER BY pi.tanggal_pengajuan DESC
            `;
            params = [pekerjaRows[0].id_pekerja];

        } else if (role === 'Direktur') {
            // Direktur melihat semua riwayat izin yang sudah selesai diproses
            query = `
                SELECT pi.*, p_pemohon.nama_pengguna as nama_pemohon, GROUP_CONCAT(CONCAT(lp.status_persetujuan, ' oleh ', p_penyetuju.nama_pengguna) SEPARATOR '; ') as approval_logs
                FROM pengajuan_izin pi
                JOIN pekerja pk ON pi.id_pekerja = pk.id_pekerja
                JOIN pengguna p_pemohon ON pk.id_pengguna = p_pemohon.id_pengguna
                LEFT JOIN log_persetujuan_izin lp ON pi.id_pengajuan = lp.id_pengajuan
                LEFT JOIN pengguna p_penyetuju ON lp.id_penyetuju = p_penyetuju.id_pengguna
                WHERE pi.status_akhir IN ('Disetujui', 'Ditolak')
                GROUP BY pi.id_pengajuan
                ORDER BY pi.tanggal_pengajuan DESC
            `;
        }

        if (!query) return res.json([]);

        const [history] = await pool.query(query, params);
        res.json(history);

    } catch (error) {
        console.error('Error fetching leave history:', error);
        res.status(500).send('Server Error');
    }
};

// FUNGSI YANG DIPERBARUI DENGAN INTEGRASI ABSENSI
exports.prosesValidasi = async (req, res) => {
    const { id: id_penyetuju, role } = req.user;
    const { id_pengajuan } = req.params;
    const { aksi, catatan } = req.body;

    try {
        const [izinRows] = await pool.query('SELECT * FROM pengajuan_izin WHERE id_pengajuan = ?', [id_pengajuan]);
        if (izinRows.length === 0) return res.status(404).json({ message: 'Pengajuan izin tidak ditemukan.' });

        const izin = izinRows[0];
        const status_sekarang = izin.status_akhir;
        let status_selanjutnya = '';

        if (aksi === 'tolak') {
            status_selanjutnya = 'Ditolak';
        } else {
            if (role === 'Supervisor' && status_sekarang === 'Menunggu Persetujuan Supervisor') status_selanjutnya = 'Disetujui Supervisor';
            else if (role === 'Manager' && status_sekarang === 'Disetujui Supervisor') status_selanjutnya = 'Disetujui';
            else if (role === 'Manager' && status_sekarang === 'Menunggu Persetujuan Manager') status_selanjutnya = 'Disetujui';
            else if (role === 'Direktur' && status_sekarang === 'Menunggu Persetujuan Direktur') status_selanjutnya = 'Disetujui';
            else return res.status(403).json({ message: 'Anda tidak memiliki wewenang untuk memvalidasi izin ini.' });
        }

        await pool.query('UPDATE pengajuan_izin SET status_akhir = ? WHERE id_pengajuan = ?', [status_selanjutnya, id_pengajuan]);

        const status_log = aksi === 'setuju' ? 'Disetujui' : 'Ditolak';
        await pool.query('INSERT INTO log_persetujuan_izin (id_pengajuan, id_penyetuju, status_persetujuan, catatan) VALUES (?, ?, ?, ?)', [id_pengajuan, id_penyetuju, status_log, catatan]);

        await logActivity(id_penyetuju, 'VALIDASI_IZIN', `Memvalidasi izin #${id_pengajuan} dengan status: ${status_selanjutnya}`, req);

        // --- INTEGRASI ABSENSI ---
        if (status_selanjutnya === 'Disetujui') {
            let currentDate = new Date(izin.tanggal_mulai);
            const endDate = new Date(izin.tanggal_selesai);

            while (currentDate <= endDate) {
                currentDate.setDate(currentDate.getDate() + 1);
                const dateString = currentDate.toISOString().slice(0, 10);

                // Masukkan ke catatan kehadiran sebagai 'Izin'
                await pool.query(
                    `INSERT INTO catatan_kehadiran (id_pekerja, waktu_clock_in, status_kehadiran, metode_verifikasi) 
                     VALUES (?, ?, 'Izin', 'Sistem') 
                     ON DUPLICATE KEY UPDATE status_kehadiran = 'Izin'`, // Mencegah error jika sudah ada data di hari itu
                    [izin.id_pekerja, `${dateString} 08:00:00`]
                );
            }
            await logActivity(id_penyetuju, 'SISTEM', `Membuat catatan absensi 'Izin' untuk izin #${id_pengajuan}`, req);
        }
        // --- AKHIR INTEGRASI ---

        res.json({ message: 'Validasi berhasil diproses.' });
    } catch (error) {
        console.error('Error processing validation:', error);
        res.status(500).send('Server Error');
    }
};