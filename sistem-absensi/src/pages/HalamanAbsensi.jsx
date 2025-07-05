// src/pages/HalamanAbsensi.jsx

import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

// Helper untuk styling badge status
const getStatusBadge = (status) => {
  switch (status) {
    case 'Hadir': return 'bg-green-100 text-green-800';
    case 'Telat': return 'bg-yellow-100 text-yellow-800';
    case 'Izin': return 'bg-blue-100 text-blue-800';
    case 'Pulang Cepat': return 'bg-purple-100 text-purple-800';
    case 'Absen': return 'bg-red-100 text-red-800';
    case 'N/A': return 'bg-gray-100 text-gray-500'; // Untuk hari tanpa data
    default: return 'bg-gray-100 text-gray-800';
  }
};

const HalamanAbsensi = () => {
  const [absensiMingguan, setAbsensiMingguan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const fetchAbsensiMingguan = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/kehadiran/mingguan', {
          headers: { Authorization: `Bearer ${token}` },
          params: { tanggal: selectedDate }
        });
        setAbsensiMingguan(response.data);
      } catch (error) {
        console.error("Gagal mengambil data absensi mingguan:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAbsensiMingguan();
  }, [selectedDate]); // Jalankan kembali setiap kali tanggal pilihan berubah

  return (
      <Layout>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan Absensi Mingguan</h1>

        {/* Filter Tanggal */}
        <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
          <label htmlFor="week-picker" className="font-medium text-gray-700">Pilih Tanggal untuk Melihat Laporan Mingguan:</label>
          <input
              type="date"
              id="week-picker"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm"
          />
        </div>

        {/* Bagian Aksi Absen (akan diimplementasikan nanti) */}
        <div className="bg-white p-6 rounded-lg shadow-md text-center mb-8">
          <h2 className="text-xl font-semibold mb-4">Pencatatan Kehadiran (Clock-In / Clock-Out)</h2>
          <p className="text-gray-500 mb-4">Fitur Scan QR dan Pengenalan Wajah akan diimplementasikan pada tahap selanjutnya.</p>
          <div className="flex justify-center gap-4">
            <button disabled className="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg cursor-not-allowed">Scan QR Code</button>
            <button disabled className="bg-gray-400 text-white px-8 py-3 rounded-lg font-semibold text-lg cursor-not-allowed">Gunakan Pengenalan Wajah</button>
          </div>
        </div>

        {/* Tabel Laporan Mingguan */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Daftar Kehadiran Pekerja</h2>
          <div className="overflow-x-auto">
            {loading ? <p>Memuat data...</p> : (
                <table className="w-full text-left table-auto">
                  <thead className="border-b-2 border-gray-200 bg-gray-50">
                  <tr>
                    <th className="p-3 font-semibold tracking-wide text-sm">Nama Pekerja</th>
                    <th className="p-3 font-semibold tracking-wide text-sm hidden lg:table-cell">Jabatan</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Sen</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Sel</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Rab</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Kam</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Jum</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Sab</th>
                    <th className="p-3 font-semibold tracking-wide text-sm text-center">Min</th>
                  </tr>
                  </thead>
                  <tbody>
                  {absensiMingguan.map((pekerja) => (
                      <tr key={pekerja.id_pekerja} className="border-b border-gray-100">
                        <td className="p-3 font-medium text-gray-800 whitespace-nowrap">{pekerja.nama_lengkap}</td>
                        <td className="p-3 text-gray-600 hidden lg:table-cell whitespace-nowrap">{pekerja.nama_pekerjaan}</td>
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(hari => (
                            <td key={hari} className="p-3 text-center">
                                <span className={`w-full px-2 py-1 text-xs font-semibold rounded-full inline-block ${getStatusBadge(pekerja[hari])}`}>
                                    {pekerja[hari]}
                                </span>
                            </td>
                        ))}
                      </tr>
                  ))}
                  </tbody>
                </table>
            )}
          </div>
        </div>
      </Layout>
  );
};

export default HalamanAbsensi;