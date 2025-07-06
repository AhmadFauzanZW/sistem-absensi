const pool = require('../config/db');

exports.getAllPekerja = async (req, res) => {
    try {
        // Ambil semua pekerja yang memiliki foto profil
        const [pekerja] = await pool.query(`
            SELECT pk.id_pekerja, p.nama_pengguna, pk.foto_profil_path
            FROM pekerja pk
            JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
            WHERE p.status_pengguna = 'Aktif' AND pk.foto_profil_path IS NOT NULL
        `);
        res.json(pekerja);
    } catch (error) {
        console.error("Gagal mengambil data pekerja:", error);
        res.status(500).send("Server Error");
    }
};

exports.getPekerjaById = async (req, res) => {
    try {
        const { id_pekerja } = req.params;
        const [pekerja] = await pool.query(`
            SELECT pk.id_pekerja, p.nama_pengguna, pk.foto_profil_path, jpk.nama_pekerjaan
            FROM pekerja pk
            JOIN pengguna p ON pk.id_pengguna = p.id_pengguna
            LEFT JOIN jenis_pekerjaan jpk ON pk.id_jenis_pekerjaan = jpk.id_jenis_pekerjaan
            WHERE pk.id_pekerja = ?
        `, [id_pekerja]);

        if (pekerja.length === 0) {
            return res.status(404).json({ message: 'Pekerja tidak ditemukan.' });
        }
        res.json(pekerja[0]);
    } catch (error) {
        console.error("Gagal mengambil data pekerja by ID:", error);
        res.status(500).send("Server Error");
    }
};