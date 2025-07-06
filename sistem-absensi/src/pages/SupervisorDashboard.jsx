import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios'; // Atau instance axios Anda
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const SupervisorDashboard = () => {
    const [summary, setSummary] = useState({
        total_pekerja: 0,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        lembur: 0,
        pulang_cepat: 0,
        absen: 0,
    });
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('hari');

    const getFilterText = () => {
        if (filter === 'minggu') return 'Minggu Ini';
        if (filter === 'bulan') return 'Bulan Ini';
        return 'Hari Ini';
    };

    const pieChartData = {
      labels: ['Hadir', 'Terlambat', 'Izin', 'Lembur', 'Pulang Cepat', 'Absen'],
      datasets: [
        {
          label: 'Kehadiran',
          data: [
            summary.hadir,
            summary.terlambat,
            summary.izin,
            summary.lembur,
            summary.pulang_cepat,
            summary.absen,
          ],
          backgroundColor: [
            'rgba(75, 192, 102, 0.8)',     // Hadir
            'rgba(255, 206, 86, 0.8)',     // Terlambat
            'rgba(54, 162, 235, 0.8)',     // Izin
            'rgba(153, 102, 255, 0.8)',     // Lembur
            'rgba(255, 159, 64, 0.8)',     // Pulang Cepat
            'rgba(255, 99, 132, 0.8)',     // Absen
          ],
          borderColor: [
            'rgba(75, 192, 102, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };


    // --- PERUBAHAN UTAMA DI DALAM USEEFFECT ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); // Reset error setiap kali fetch
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // Siapkan kedua promise untuk dijalankan secara paralel
                const summaryPromise = axios.get('http://localhost:5000/api/dashboard/summary', {
                    headers,
                    params: { filter },
                });
                const activitiesPromise = axios.get('http://localhost:5000/api/dashboard/activities', {
                    headers,
                    params: { filter, page: pagination.currentPage },
                });

                // Tunggu hingga kedua promise selesai
                const [summaryRes, activitiesRes] = await Promise.all([summaryPromise, activitiesPromise]);

                // Setelah keduanya berhasil, baru perbarui semua state
                setSummary(summaryRes.data);
                setActivities(activitiesRes.data.activities);
                setPagination(activitiesRes.data.pagination);

            } catch (err) {
                console.error('Gagal mengambil data dashboard:', err);
                setError('Gagal memuat data. Silakan coba lagi nanti.');
            } finally {
                // Hanya set loading ke false setelah semua proses selesai
                setLoading(false);
            }
        };

        fetchData();
    }, [filter, pagination.currentPage]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    return (
        <Layout>
            {/* Bagian Judul dan Filter */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Supervisor</h1>
                    <p className="text-gray-500">Menampilkan data untuk: <span className="font-semibold text-blue-600">{getFilterText()}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => handleFilterChange('hari')} className={`px-4 py-2 text-sm font-medium rounded ${filter === 'hari' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>Hari Ini</button>
                    <button onClick={() => handleFilterChange('minggu')} className={`px-4 py-2 text-sm font-medium rounded ${filter === 'minggu' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>Minggu Ini</button>
                    <button onClick={() => handleFilterChange('bulan')} className={`px-4 py-2 text-sm font-medium rounded ${filter === 'bulan' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-700'}`}>Bulan Ini</button>
                </div>
                <div>
                    <Link to="/supervisor/absensi" className="bg-green-600 text-white px-6 py-3 rounded font-bold text-md hover:bg-green-700 text-center block shadow-lg">
                        Mulai Sesi Absensi
                    </Link>
                </div>
            </div>

            {/* Kartu Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
              <StatCard title="Total Pekerja" value={summary.total_pekerja} color="bg-blue-100 text-blue-600" icon="👥" />
              <StatCard title="Hadir" value={summary.hadir} color="bg-green-100 text-green-600" icon="✅" />
              <StatCard title="Terlambat" value={summary.terlambat} color="bg-yellow-100 text-yellow-600" icon="⚠️" />
              <StatCard title="Izin" value={summary.izin} color="bg-cyan-100 text-cyan-600" icon="📝" />
              <StatCard title="Lembur" value={summary.lembur} color="bg-indigo-100 text-indigo-600" icon="💼" />
              <StatCard title="Pulang Cepat" value={summary.pulang_cepat} color="bg-orange-100 text-orange-600" icon="🏃‍♂️" />
              <StatCard title="Absen" value={summary.absen} color="bg-red-100 text-red-600" icon="❌" />
            </div>


            {/* Grafik dan Tabel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Ringkasan Kehadiran</h2>
                    <div className="h-64 flex justify-center items-center">
                        <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Aktivitas Kehadiran Terbaru</h2>
                    {loading ? (
                        <div className="flex-grow flex items-center justify-center text-gray-500">Memuat aktivitas...</div>
                    ) : error ? (
                        <div className="flex-grow flex items-center justify-center text-red-500">{error}</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left">
                                    <thead className="border-b-2 border-gray-200">
                                    <tr>
                                        <th className="py-2 px-3">Nama Pekerja</th>
                                        <th className="py-2 px-3">Tanggal</th>
                                        <th className="py-2 px-3">Jam Masuk</th>
                                        <th className="py-2 px-3">Jam Pulang</th>
                                        <th className="py-2 px-3">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {activities.length > 0 ? (
                                        activities.map((activity, index) => (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-3 font-medium">{activity.nama_pengguna}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.tanggal}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.jam_masuk || '-'}</td>
                                                <td className="py-3 px-3 text-gray-600">{activity.jam_pulang || '-'}</td>
                                                <td className="py-3 px-3">
                                                  <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                      activity.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-800' :
                                                      activity.status_kehadiran === 'Telat' ? 'bg-yellow-100 text-yellow-800' :
                                                      activity.status_kehadiran === 'Izin' ? 'bg-cyan-100 text-cyan-800' :
                                                      activity.status_kehadiran === 'Lembur' ? 'bg-indigo-100 text-indigo-800' :
                                                      activity.status_kehadiran === 'Pulang Cepat' ? 'bg-orange-100 text-orange-800' :
                                                      activity.status_kehadiran === 'Absen' ? 'bg-red-100 text-red-800' :
                                                      activity.status_kehadiran === 'N/A' ? 'bg-gray-100 text-gray-500' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}
                                                    >
                                                      {activity.status_kehadiran}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-6 text-gray-500">Tidak ada data kehadiran untuk periode ini.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                    <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                        Sebelumnya
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Halaman {pagination.currentPage} dari {pagination.totalPages}
                                    </span>
                                    <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                        Berikutnya
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorDashboard;