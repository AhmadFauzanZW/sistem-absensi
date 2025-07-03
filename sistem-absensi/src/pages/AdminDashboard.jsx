import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [izinUntukValidasi, setIzinUntukValidasi] = useState([]);
    const [logs, setLogs] = useState([]);
    const [lokasiList, setLokasiList] = useState([]);
    const [lokasiTerpilih, setLokasiTerpilih] = useState('semua');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fungsi fetch data izin (untuk Manager)
    const fetchIzinData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/izin/validasi', {
                headers: { Authorization: `Bearer ${token}` },
                params: { lokasi: lokasiTerpilih }
            });
            setIzinUntukValidasi(response.data);
        } catch (error) {
            console.error("Gagal mengambil data validasi izin:", error);
        }
    };

    // Fungsi fetch log aktivitas (untuk Direktur)
    const fetchLogData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/logs', {
                headers: { Authorization: `Bearer ${token}` },
                params: { lokasi: lokasiTerpilih }
            });
            setLogs(response.data);
        } catch (error) {
            console.error("Gagal mengambil log aktivitas:", error);
        }
    };

    // Fungsi fetch daftar lokasi proyek
    const fetchLokasiList = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/proyek/lokasi', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLokasiList(response.data);
        } catch (error) {
            console.error("Gagal mengambil daftar lokasi:", error);
        }
    };

    // Fetch semua data tergantung pada role pengguna
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                await fetchLokasiList();

                if (user?.role === 'Manager') {
                    await fetchIzinData();
                }

                if (user?.role === 'Direktur') {
                    await fetchLogData();
                }
            } catch (err) {
                setError('Gagal memuat beberapa data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user.role, lokasiTerpilih]);

    // Handle action untuk persetujuan izin
    const handleAction = async (id_pengajuan, aksi) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/izin/${id_pengajuan}/proses`,
                { aksi },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            // Refresh data izin setelah update
            fetchIzinData();
        } catch (err) {
            console.error(`Gagal memproses izin (${aksi}):`, err);
            alert(`Gagal memproses izin. ${err.response?.data?.message || 'Silakan coba lagi.'}`);
        }
    };

    // Text untuk filter
    const getFilterText = () => {
        if (lokasiTerpilih === 'semua') return 'Semua Lokasi';
        const selected = lokasiList.find(loc => loc.id_lokasi == lokasiTerpilih); // gunakan == untuk string vs number
        return selected ? selected.nama_lokasi : 'Tidak ditemukan';
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-screen">Memuat dashboard...</div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="text-center text-red-600 p-4">{error}</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard {user.role}</h1>
                    <p className="text-gray-500 mt-2">Menampilkan data untuk: <span className="font-semibold text-blue-600">{getFilterText()}</span></p>
                </div>

                {/* Dropdown Lokasi Proyek */}
                {(user?.role === 'Manager' || user?.role === 'Direktur') && (
                    <div className="mt-4 sm:mt-0">
                        <label className="text-sm mr-2">Lokasi Proyek:</label>
                        <select
                            onChange={(e) => setLokasiTerpilih(e.target.value)}
                            value={lokasiTerpilih}
                            className="border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="semua">Semua Lokasi</option>
                            {lokasiList.map((l) => (
                                <option key={l.id_lokasi} value={l.id_lokasi}>
                                    {l.nama_lokasi}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* --- KONTEN KHUSUS MANAGER --- */}
            {user?.role === 'Manager' && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="font-semibold text-lg mb-4">Izin Membutuhkan Persetujuan Anda</h2>
                    {izinUntukValidasi.length > 0 ? (
                        <div className="space-y-3">
                            {izinUntukValidasi.map((izin) => (
                                <div key={izin.id_pengajuan} className="border p-3 rounded flex justify-between items-center">
                                    <div>
                                        <p><strong>{izin.nama_pengguna}</strong> ({izin.jenis_izin})</p>
                                        <p className="text-sm text-gray-600">Alasan: {izin.keterangan}</p>
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
            )}

            {/* --- KONTEN KHUSUS DIREKTUR - LOG AKTIVITAS --- */}
            {user?.role === 'Direktur' && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
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
                                            {log.nama_lengkap || log.user} ({log.nama_peran || log.role})
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

            {/* Ringkasan Umum */}
            <div className="mt-6">
                <p className="text-gray-600">
                    Analitik dan ringkasan data dari lokasi{' '}
                    <strong>
                        {lokasiTerpilih === 'semua'
                            ? 'semua proyek'
                            : lokasiList.find((l) => l.id_lokasi == lokasiTerpilih)?.nama_lokasi ||
                            'tidak ditemukan'}
                    </strong>{' '}
                    akan ditampilkan di sini.
                </p>
            </div>
        </Layout>
    );
};

export default AdminDashboard;