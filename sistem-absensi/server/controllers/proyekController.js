const pool = require('../config/db');

exports.getLokasiProyek = async (req, res) => {
    try {
        const [lokasi] = await pool.query('SELECT id_lokasi, nama_lokasi FROM lokasi_proyek WHERE status_proyek = "Aktif"');
        res.json(lokasi);
    } catch (error) {
        console.error('Gagal mengambil lokasi proyek:', error);
        res.status(500).send('Server Error');
    }
};