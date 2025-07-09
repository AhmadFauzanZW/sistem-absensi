import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link
import StatCard from '../components/StatCard'; // Kita akan gunakan StatCard

const AdminDashboard = () => {
    const { user } = useAuth();
    // --- STATE BARU ---
    const [dashboardData, setDashboardData] = useState(null);
    const [izinUntukValidasi, setIzinUntukValidasi] = useState([]);

    // State lama untuk Direktur (jika diperlukan)
    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FUNGSI FETCH DATA BARU ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            try {
                // Kumpulan promise untuk semua data yang dibutuhkan
                const promises = [
                    axios.get('http://localhost:5000/api/dashboard/manager', { headers }),
                    axios.get('http://localhost:5000/api/izin/validasi', { headers })
                ];

                // Jika rolenya Direktur, tambahkan promise untuk fetch log
                if (user?.role === 'Direktur') {
                    promises.push(axios.get('http://localhost:5000/api/logs', { headers }));
                }

                const [managerRes, izinRes, logRes] = await Promise.all(promises);

                setDashboardData(managerRes.data);
                setIzinUntukValidasi(izinRes.data);

                if (logRes) {
                    setLogs(logRes.data);
                }

            } catch (err) {
                console.error("Gagal memuat data dashboard:", err);
                setError('Gagal memuat beberapa data. Coba refresh halaman.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.role]);

    const handleAction = async (id_pengajuan, aksi) => {
        let catatan = '';

        if (aksi === 'tolak') {
            let alasan = '';
            do {
                alasan = window.prompt('Mohon masukkan alasan penolakan:');
                if (alasan === null) return;
            } while (!alasan.trim());
            catatan = alasan;
        } else {
            const catatanOpsional = window.prompt('Tambahkan catatan (opsional):', 'Disetujui');
            if (catatanOpsional === null) return;
            catatan = catatanOpsional;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/izin/${id_pengajuan}/proses`,
                { aksi, catatan }, // <-- KIRIM 'catatan' DI SINI
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIzinData(); // Refresh list
        } catch (error) {
            alert(`Gagal memproses. ${error.response?.data?.message || ''}`);
        }
    };

    if (loading) return <Layout><div className="text-center p-10">Memuat Dashboard...</div></Layout>;
    if (error) return <Layout><div className="text-center p-10 text-red-500">{error}</div></Layout>;

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard {user.role}</h1>

            {/* --- KARTU RINGKASAN AGREGAT --- */}
            {dashboardData && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Proyek Aktif" value={dashboardData.summaryCards.totalProyek} icon="🏗️" />
                    <StatCard title="Total Pekerja" value={dashboardData.summaryCards.totalPekerja} icon="👥" />
                    <StatCard title="Hadir Hari Ini" value={dashboardData.summaryCards.hadir} icon="✅" />
                    <StatCard title="Absen Hari Ini" value={dashboardData.summaryCards.absen} icon="❌" />
                </div>
            )}

            {/* --- PINTASAN (SHORTCUTS) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Link to="/manager/kelola-pekerja" className="p-6 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 transition-colors">
                    <h2 className="text-2xl font-bold">Kelola Pekerja</h2>
                    <p className="mt-1">Tambah, edit, dan atur penugasan pekerja.</p>
                </Link>
                <Link to="/manager/laporan" className="p-6 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 transition-colors">
                    <h2 className="text-2xl font-bold">Laporan Proyek</h2>
                    <p className="mt-1">Buat laporan kehadiran dan penggajian.</p>
                </Link>
            </div>

            {/* --- TABEL DENYUT NADI PROYEK (PROJECT PULSE) --- */}
            {dashboardData && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                    <h2 className="font-semibold text-xl mb-4">Denyut Nadi Proyek (Hari Ini)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 bg-gray-50">
                            <tr>
                                <th className="p-3 font-semibold text-sm">Nama Proyek</th>
                                <th className="p-3 font-semibold text-sm hidden md:table-cell">Supervisor</th>
                                <th className="p-3 font-semibold text-sm text-center">Pekerja</th>
                                <th className="p-3 font-semibold text-sm text-center">Hadir</th>
                                <th className="p-3 font-semibold text-sm text-center">Telat</th>
                                <th className="p-3 font-semibold text-sm text-center">Absen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {dashboardData.projectPulse.map((proyek) => (
                                <tr key={proyek.id_lokasi} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium">{proyek.nama_lokasi}</td>
                                    <td className="p-3 text-gray-600 hidden md:table-cell">{proyek.nama_supervisor || '-'}</td>
                                    <td className="p-3 text-center">{proyek.total_pekerja_proyek}</td>
                                    <td className="p-3 text-center text-green-600 font-semibold">{proyek.total_hadir_hari_ini}</td>
                                    <td className="p-3 text-center text-yellow-600 font-semibold">{proyek.total_telat_hari_ini}</td>
                                    <td className="p-3 text-center text-red-600 font-semibold">{proyek.total_absen_hari_ini}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- DAFTAR PERSETUJUAN IZIN --- */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="font-semibold text-lg mb-4">Izin Membutuhkan Persetujuan Anda</h2>
                {izinUntukValidasi.length > 0 ? (
                    <div className="space-y-3">
                        {izinUntukValidasi.map((izin) => (
                            <div key={izin.id_pengajuan} className="border p-3 rounded flex justify-between items-center">
                                <div>
                                    <p><strong>{izin.nama_pengguna}</strong> ({izin.jenis_izin})</p>
                                    <p className="text-sm text-gray-600">Alasan: {izin.keterangan}</p>
                                    {/* Lampiran (jika ada) */}
                                    {izin.file_bukti_path && (
                                        <div className="mt-4">
                                            <a
                                                href={`http://localhost:5000/uploads/${izin.file_bukti_path}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full md:w-auto text-center bg-gray-200 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-300 transition"
                                            >
                                                Lihat Lampiran
                                            </a>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleAction(izin.id_pengajuan, 'tolak')}
                                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => handleAction(izin.id_pengajuan, 'setuju')}
                                        className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition"
                                    >
                                        Setujui
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">Tidak ada pengajuan izin yang menunggu persetujuan.</p>
                )}
            </div>

            {/* --- KONTEN KHUSUS DIREKTUR (JIKA ADA) --- */}
            {user?.role === 'Direktur' && logs.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="font-semibold text-lg mb-4">Log Aktivitas Pengguna</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b-2 border-gray-200">
                            <tr>
                                <th className="py-2">Waktu</th>
                                <th className="py-2">Pengguna</th>
                                <th className="py-2">Aksi</th>
                                <th className="py-2">Deskripsi</th>
                            </tr>
                            </thead>
                            <tbody>
                            {logs.length > 0 ? (
                                logs.map((log, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="py-2 pr-4 whitespace-nowrap">
                                            {new Date(log.waktu_aktivitas).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-2 pr-4">
                                            {log.nama_pengguna || log.user} ({log.nama_peran || log.role})
                                        </td>
                                        <td className="py-2 pr-4">
                        <span className="bg-gray-200 px-2 py-1 rounded-full text-xs">
                          {log.tipe_aktivitas || log.action}
                        </span>
                                        </td>
                                        <td className="py-2">{log.deskripsi || log.description}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-4 text-gray-500">
                                        Tidak ada log aktivitas.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminDashboard;