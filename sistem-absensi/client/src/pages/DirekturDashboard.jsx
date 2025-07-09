import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import StatCard from '../components/StatCard';
import { Line, Bar } from 'react-chartjs-2';

const DirekturDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
                    <div className="overflow-y-auto h-80">
                        {/* Tabel untuk menampilkan data.activityLog */}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default DirekturDashboard;