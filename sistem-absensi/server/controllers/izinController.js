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

// Endpoint untuk memproses persetujuan atau penolakan izin
exports.prosesValidasi = async (req, res) => {
    // ---- PERBAIKAN 2 ----
    // Ambil 'id' dari req.user, bukan 'id_pengguna'
    const { id: id_pengguna, role } = req.user;
    const { id_pengajuan } = req.params;
    const { aksi, catatan } = req.body;

    try {
        const [izinRows] = await pool.query('SELECT status_akhir FROM pengajuan_izin WHERE id_pengajuan = ?', [id_pengajuan]);
        if (izinRows.length === 0) return res.status(404).json({ message: 'Pengajuan izin tidak ditemukan.' });

        const status_sekarang = izinRows[0].status_akhir;
        let status_selanjutnya = '';

        if (aksi === 'tolak') {
            status_selanjutnya = 'Ditolak';
        } else {
            if (role === 'Supervisor' && status_sekarang === 'Menunggu Persetujuan Supervisor') {
                status_selanjutnya = 'Disetujui Supervisor';
            } else if (role === 'Manager' && status_sekarang === 'Disetujui Supervisor') {
                status_selanjutnya = 'Disetujui';
            } else if (role === 'Manager' && status_sekarang === 'Menunggu Persetujuan Manager') {
                status_selanjutnya = 'Disetujui';
            } else if (role === 'Direktur' && status_sekarang === 'Menunggu Persetujuan Direktur') {
                status_selanjutnya = 'Disetujui';
            } else {
                return res.status(403).json({ message: 'Anda tidak memiliki wewenang untuk memvalidasi izin ini pada tahap ini.' });
            }
        }

        await pool.query('UPDATE pengajuan_izin SET status_akhir = ? WHERE id_pengajuan = ?', [status_selanjutnya, id_pengajuan]);

        const status_log = aksi === 'setuju' ? 'Disetujui' : 'Ditolak';
        await pool.query(
            'INSERT INTO log_persetujuan_izin (id_pengajuan, id_penyetuju, status_persetujuan, catatan) VALUES (?, ?, ?, ?)',
            [id_pengajuan, id_pengguna, status_log, catatan]
        );

        await logActivity(id_pengguna, 'VALIDASI_IZIN', `Memvalidasi izin #${id_pengajuan} dengan status: ${status_selanjutnya}`, req);

        res.json({ message: 'Validasi berhasil diproses.' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};