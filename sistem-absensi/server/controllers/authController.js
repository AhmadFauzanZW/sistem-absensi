const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Based on your ERD: Pengguna -> Pekerja
    const [users] = await pool.query(
      `SELECT 
        p.id_pengguna, p.password_hash, pr.nama_peran, 
        pk.id_pekerja, p.nama_pengguna, jpk.nama_pekerjaan
       FROM pengguna p
       JOIN peran pr ON p.id_peran = pr.id_peran
       LEFT JOIN pekerja pk ON p.id_pengguna = pk.id_pengguna
       LEFT JOIN jenis_pekerjaan jpk ON pk.id_jenis_pekerjaan = jpk.id_jenis_pekerjaan
       WHERE p.email = ? AND p.status_pengguna = 'Aktif'`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = users[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // Create a payload for the token
    const payload = {
      user: {
        id: user.id_pengguna,
        role: user.nama_peran,
        name: user.nama_pengguna
      }
    };

    // Sign the JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Return the token and user info to the client
    res.json({
      token,
      user: {
        id: user.id_pekerja, // From Pekerja table
        name: user.nama_pengguna,
        role: user.nama_peran,
        jabatan: user.nama_pekerjaan,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};