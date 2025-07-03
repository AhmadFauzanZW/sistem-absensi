import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Import Dummy Data (untuk Manager)
import {pengajuanIzinList, pengajuanIzinList as initialIzinList} from '../data/dummyData';
import { lokasiProyekList } from '../data/dummyData';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [lokasiTerpilih, setLokasiTerpilih] = useState('semua');

    // State untuk izin manager (dari dummyData)
    const [izinList, setIzinList] = useState(initialIzinList);

    // State untuk log aktivitas direktur (dari API)
    const [logs, setLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(true);

    // Filter izin yang menunggu persetujuan Manager
    // const izinUntukManager = izinList.filter(
    //     (izin) =>
    //         izin.persetujuan.supervisor === 'Disetujui' &&
    //         izin.persetujuan.manager === 'Menunggu'
    // );

    // Fetch log aktivitas dari backend jika role Direktur
    useEffect(() => {
        if (user?.role === 'Direktur') {
            const fetchLogs = async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await axios.get('http://localhost:5000/api/logs', {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    setLogs(response.data);
                } catch (error) {
                    console.error("Gagal memuat log aktivitas:", error);
                } finally {
                    setLoadingLogs(false);
                }
            };

            fetchLogs();
        }
    }, [user]);

    return (
        <Layout>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard {user.role}</h1>

                {/* Dropdown Lokasi untuk Manager */}
                {user.role === 'Manager' && (
                    <div>
                        <label className="text-sm mr-2">Lokasi Proyek:</label>
                        <select
                            onChange={(e) => setLokasiTerpilih(e.target.value)}
                            className="border-gray-300 rounded-md shadow-sm"
                        >
                            <option value="semua">Semua Lokasi</option>
                            {lokasiProyekList.map((l) => (
                                <option key={l.id} value={l.id}>
                                    {l.nama}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* --- KONTEN KHUSUS MANAGER --- */}
            {user.role === 'Manager' && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="font-semibold text-lg mb-4">Izin Membutuhkan Persetujuan Anda</h2>
                    {pengajuanIzinList.length > 0 ? (
                        <div className="space-y-3">
                            {pengajuanIzinList.map((izin) => (
                                <div
                                    key={izin.id}
                                    className="border p-3 rounded flex justify-between items-center"
                                >
                                    <div>
                                        <p>
                                            <strong>{izin.namaPekerja}</strong> ({izin.tanggalMulai})
                                        </p>
                                        <p className="text-sm">{izin.alasan}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition">
                                            Tolak
                                        </button>
                                        <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm hover:bg-green-200 transition">
                                            Setujui
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Tidak ada pengajuan izin yang membutuhkan persetujuan.</p>
                    )}
                </div>
            )}

            {/* --- KONTEN KHUSUS DIREKTUR (SUPER-USER) - LOG AKTIVITAS REALTIME --- */}
            {user.role === 'Direktur' && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="font-semibold text-lg mb-4">Log Aktivitas Pengguna</h2>
                    {loadingLogs ? (
                        <p>Loading logs...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                <tr className="border-b-2">
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
                                            Tidak ada log aktivitas untuk ditampilkan.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Ringkasan Umum */}
            <div className="mt-6">
                <p className="text-gray-600">
                    Analitik dan ringkasan data dari lokasi{' '}
                    <strong>
                        {lokasiTerpilih === 'semua'
                            ? 'semua proyek'
                            : lokasiProyekList.find((l) => l.id === lokasiTerpilih)?.nama ||
                            'tidak ditemukan'}
                    </strong>{' '}
                    akan ditampilkan di sini.
                </p>
            </div>
        </Layout>
    );
};

export default AdminDashboard;