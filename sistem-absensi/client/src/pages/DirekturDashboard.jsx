import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { Line, Bar } from 'react-chartjs-2';

const DirekturDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Ganti dengan endpoint Anda yang sebenarnya nanti
            // const res = await axios.get('/api/dashboard/direktur', { headers: { Authorization: `Bearer ${token}` } });
            // setData(res.data);

            // Data dummy untuk sementara
            setData({
                summaryCards: { totalCost: 125000000, avgProductivity: 7.8, absenceRate: 5 },
                costPerProjectChart: { labels: ['Proyek A', 'Proyek B'], datasets: [{ label: 'Biaya Gaji (Juta Rp)', data: [75, 50] }] },
                activityLog: [{ id: 1, user: 'Slamet Riyadi', action: 'APPROVE_IZIN', time: '2025-07-09 10:00' }]
            });
            setLoading(false);
        };
        fetchData();
    }, []);

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

    if (loading) return <Layout><p className="p-6">Memuat Dasbor Direktur...</p></Layout>;

    return (
        <Layout>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Direktur</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Biaya Gaji (Bulan Ini)" value={`Rp ${(data.summaryCards.totalCost / 1000000).toFixed(1)} Jt`} icon="💰" />
                <StatCard title="Produktivitas Rata-rata" value={`${data.summaryCards.avgProductivity} Jam/Hari`} icon="📈" />
                <StatCard title="Tingkat Absensi" value={`${data.summaryCards.absenceRate}%`} icon="📉" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Biaya Gaji per Proyek (Bulan Ini)</h2>
                    <div className="h-80">
                        <Bar options={{ responsive: true, maintainAspectRatio: false }} data={data.costPerProjectChart} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Log Aktivitas Sistem</h2>
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
            </div>
        </Layout>
    );
};

export default DirekturDashboard;