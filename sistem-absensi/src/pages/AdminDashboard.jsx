import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [izinUntukValidasi, setIzinUntukValidasi] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchIzinData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/izin/validasi', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIzinUntukValidasi(response.data);
        } catch (error) {
            console.error("Gagal mengambil data validasi izin:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            if (user?.role === 'Manager') {
                await fetchIzinData();
            }
            if (user?.role === 'Direktur') {
                // Fetch log aktivitas direktur
                try {
                    const token = localStorage.getItem('token');
                    const logRes = await axios.get('http://localhost:5000/api/logs', { headers: { Authorization: `Bearer ${token}` } });
                    setLogs(logRes.data);
                } catch (error) {
                    console.error("Gagal mengambil log:", error);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [user.role]);

    const handleAction = async (id_pengajuan, aksi) => {
        // Logika sama persis dengan di halaman ValidasiIzin.jsx
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/izin/${id_pengajuan}/proses`,
                { aksi }, { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchIzinData(); // Refresh list
        } catch (error) {
            alert(`Gagal memproses. ${error.response?.data?.message || ''}`);
        }
    };

    if (loading) return <Layout><p>Loading dashboard...</p></Layout>;

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard {user.role}</h1>

            {/* KONTEN KHUSUS MANAGER */}
            {user.role === 'Manager' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="font-semibold text-lg mb-4">Validasi Izin Menunggu</h2>
                    <div className="space-y-3">
                        {izinUntukValidasi.length > 0 ? izinUntukValidasi.map(izin => (
                            <div key={izin.id_pengajuan} className="border p-4 rounded-md">
                                <p><span className="font-bold">{izin.nama_lengkap}</span> mengajukan {izin.jenis_izin}.</p>
                                <p className="text-sm text-gray-600">Status: {izin.status_akhir}</p>
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => handleAction(izin.id_pengajuan, 'tolak')} className="bg-red-100 text-red-700 px-3 py-1 text-sm rounded">Tolak</button>
                                    <button onClick={() => handleAction(izin.id_pengajuan, 'setuju')} className="bg-green-100 text-green-700 px-3 py-1 text-sm rounded">Setujui</button>
                                </div>
                            </div>
                        )) : <p>Tidak ada izin yang perlu divalidasi.</p>}
                    </div>
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