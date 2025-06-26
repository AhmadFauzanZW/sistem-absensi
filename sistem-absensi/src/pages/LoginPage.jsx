import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { daftarPekerja } from '../data/dummyData';

const LoginPage = () => {
  const [idPekerja, setIdPekerja] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const { loginAction } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Cari pekerja berdasarkan ID
    const user = daftarPekerja.find((p) => p.id === idPekerja);

    if (!user) {
      setError('ID Pekerja tidak ditemukan');
      return;
    }

    if (user.password !== password) {
      setError('Password salah');
      return;
    }

    // Simulasi response API
    const dummyResponseData = {
      token: `token-${user.id}`,
      user: {
        id: user.id,
        name: user.nama,
        role: user.role,
        jabatan: user.jabatan,
      },
    };

    // Panggil login dari context
    loginAction(dummyResponseData);

    // Redirect berdasarkan role
    switch (user.role) {
      case 'Supervisor':
        navigate('/supervisor/dashboard');
        break;
      case 'Pekerja':
        navigate('/pekerja/profil');
        break;
      case 'Manager':
      case 'Direktur':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login Sistem Absensi Pekerja</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="idPekerja" className="block text-sm font-medium text-gray-700">
              ID Pekerja
            </label>
            <input
              id="idPekerja"
              type="text"
              value={idPekerja}
              onChange={(e) => setIdPekerja(e.target.value)}
              placeholder="Masukkan ID seperti P001"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition duration-200"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;