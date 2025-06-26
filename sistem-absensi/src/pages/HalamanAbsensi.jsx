import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getInitialAttendanceList } from '../data/dummyData';

// Helper untuk styling badge status
const getStatusBadge = (status) => {
  switch (status) {
    case 'Hadir':
      return 'bg-green-100 text-green-800';
    case 'Terlambat':
      return 'bg-yellow-100 text-yellow-800';
    case 'Izin':
    case 'Sakit':
      return 'bg-blue-100 text-blue-800';
    case 'Absen':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const HalamanAbsensi = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [attendanceList, setAttendanceList] = useState(getInitialAttendanceList());

  // Efek membersihkan hasil scan setelah beberapa detik
  useEffect(() => {
    if (scanResult) {
      const timer = setTimeout(() => {
        setScanResult(null);
        setIsScanning(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [scanResult]);

  const handleStartScan = (type) => {
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      const unAttendedWorkers = attendanceList.filter((p) => p.status === 'Belum Hadir');

      if (unAttendedWorkers.length === 0) {
        setScanResult({
          success: false,
          message: 'Semua pekerja sudah diabsen.',
        });
        return;
      }

      const randomPekerja = unAttendedWorkers[Math.floor(Math.random() * unAttendedWorkers.length)];
      handleManualChangeStatus(randomPekerja.id, 'Hadir');

      setScanResult({
        success: true,
        message: `Kehadiran untuk ${randomPekerja.nama} telah dicatat sebagai "Hadir".`,
      });
    }, 2000);
  };

  const handleManualChangeStatus = (pekerjaId, newStatus) => {
    setAttendanceList((currentList) =>
      currentList.map((pekerja) =>
        pekerja.id === pekerjaId ? { ...pekerja, status: newStatus } : pekerja
      )
    );
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pencatatan Kehadiran</h1>

      {/* --- BAGIAN SCANNER (PRIORITAS UTAMA) --- */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center mb-8">
        {/* Tampilan Kamera / Hasil Scan */}
        <div className="w-full max-w-lg mx-auto h-72 bg-gray-900 rounded-lg flex justify-center items-center mb-6 text-white overflow-hidden">
          {isScanning && !scanResult && <p className="animate-pulse">Mencari Wajah / QR Code...</p>}
          {!isScanning && <p>Arahkan kamera ke wajah atau QR Code pekerja.</p>}
          {scanResult && (
            <div className={`p-4 text-center ${scanResult.success ? 'text-green-400' : 'text-red-400'}`}>
              <p className="text-2xl font-bold">{scanResult.success ? 'Berhasil' : 'Gagal'}</p>
              <p>{scanResult.message}</p>
            </div>
          )}
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => handleStartScan('QR')}
            disabled={isScanning}
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            Scan QR Code
          </button>
          <button
            onClick={() => handleStartScan('Wajah')}
            disabled={isScanning}
            className="w-full sm:w-auto bg-teal-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-teal-700 disabled:bg-gray-400"
          >
            Gunakan Pengenalan Wajah
          </button>
        </div>
      </div>

      {/* --- BAGIAN DAFTAR PEKERJA (BACKUP & MONITORING) --- */}
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Daftar Kehadiran Pekerja Hari Ini</h2>
        <p className="text-sm text-gray-500 mb-4">
          Gunakan daftar ini untuk memantau status dan melakukan perubahan manual jika diperlukan.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b-2 border-gray-200">
              <tr>
                <th className="p-3">Nama Pekerja</th>
                <th className="p-3 hidden md:table-cell">Jabatan</th>
                <th className="p-3 text-center">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((pekerja) => (
                <tr key={pekerja.id} className="border-b border-gray-100">
                  <td className="p-3 font-medium">{pekerja.nama}</td>
                  <td className="p-3 text-gray-600 hidden md:table-cell">{pekerja.jabatan}</td>
                  <td className="p-3 text-center">
                    <select
                      value={pekerja.status}
                      onChange={(e) => handleManualChangeStatus(pekerja.id, e.target.value)}
                      className={`w-full sm:w-auto px-2 py-1 text-xs font-semibold rounded-full border-none appearance-none text-center ${getStatusBadge(
                        pekerja.status
                      )}`}
                    >
                      <option value="Belum Hadir">Belum Hadir</option>
                      <option value="Hadir">Hadir</option>
                      <option value="Terlambat">Terlambat</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Izin">Izin</option>
                      <option value="Absen">Absen</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default HalamanAbsensi;