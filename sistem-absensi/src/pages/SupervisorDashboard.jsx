import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
        absen: 0,
    });
    const [catatanKehadiran, setCatatanKehadiran] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('hari'); // 'hari', 'minggu', 'bulan'

    // Fungsi untuk teks filter
    const getFilterText = () => {
        if (filter === 'minggu') return 'Minggu Ini';
        if (filter === 'bulan') return 'Bulan Ini';
        return 'Hari Ini';
    };

    // Data untuk Pie Chart
    const pieChartData = {
        labels: ['Hadir', 'Terlambat', 'Absen'],
        datasets: [
            {
                label: 'Kehadiran',
                data: [summary.hadir, summary.terlambat, summary.absen],
                backgroundColor: [
                    'rgba(75, 192, 102, 0.8)', // Hijau untuk Hadir
                    'rgba(255, 206, 86, 0.8)', // Kuning untuk Terlambat
                    'rgba(255, 99, 132, 0.8)', // Merah untuk Absen
                ],
                borderColor: [
                    'rgba(75, 192, 102, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    // Fetch data dashboard dan catatan kehadiran
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const params = { filter };

                // Ambil data ringkasan
                const summaryRes = await axios.get('http://localhost:5000/api/dashboard/summary', {
                    headers,
                    params,
                });

                // Ambil data kehadiran
                const attendanceRes = await axios.get('http://localhost:5000/api/kehadiran', {
                    headers,
                    params,
                });

                setSummary(summaryRes.data);
                setCatatanKehadiran(attendanceRes.data);
            } catch (err) {
                console.error('Gagal mengambil data dashboard:', err);
                setError('Gagal memuat data. Silakan coba lagi nanti.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filter]);

    if (loading && !error) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-screen">Memuat data...</div>
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
            {/* Judul dan Tombol Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Supervisor</h1>
                    <p className="text-gray-500">
                        Menampilkan data untuk: <span className="font-semibold text-blue-600">{getFilterText()}</span>
                    </p>
                </div>

                {/* Tombol Filter */}
                <div className="flex space-x-2 mt-4 sm:mt-0">
                    <button
                        onClick={() => setFilter('hari')}
                        className={`px-4 py-2 text-sm font-medium rounded ${
                            filter === 'hari' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        Hari Ini
                    </button>
                    <button
                        onClick={() => setFilter('minggu')}
                        className={`px-4 py-2 text-sm font-medium rounded ${
                            filter === 'minggu' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        Minggu Ini
                    </button>
                    <button
                        onClick={() => setFilter('bulan')}
                        className={`px-4 py-2 text-sm font-medium rounded ${
                            filter === 'bulan' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
                        }`}
                    >
                        Bulan Ini
                    </button>
                </div>

                {/* Tombol Mulai Sesi Absensi */}
                <div className="mt-8 sm:mt-0">
                    <Link
                        to="/supervisor/absensi"
                        className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded font-bold text-md hover:bg-green-700 text-center block"
                    >
                        Mulai Sesi Absensi
                    </Link>
                </div>
            </div>

            {/* Bagian Kartu Statistik Responsif */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Pekerja" value={summary.total_pekerja} color="bg-blue-100 text-blue-600" icon={'👥'} />
                <StatCard title="Hadir" value={summary.hadir} color="bg-green-100 text-green-600" icon={'✅'} />
                <StatCard title="Terlambat" value={summary.terlambat} color="bg-yellow-100 text-yellow-600" icon={'⚠️'} />
                <StatCard title="Absen" value={summary.absen} color="bg-red-100 text-red-600" icon={'❌'} />
            </div>

            {/* Bagian Grafik dan Tabel Responsif */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Grafik */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Ringkasan Kehadiran</h2>
                    <div className="h-64 flex justify-center items-center">
                        <Pie data={pieChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>

                {/* Kolom Tabel Kehadiran Terbaru */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Aktivitas Kehadiran Terbaru</h2>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <p>Loading data...</p>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-gray-200">
                                <tr>
                                    <th className="py-2">Nama Pekerja</th>
                                    <th className="py-2 hidden lg:table-cell">Tanggal</th>
                                    <th className="py-2 hidden sm:table-cell">Jam Masuk</th>
                                    <th className="py-2">Status</th>
                                </tr>
                                </thead>
                                <tbody>
                                {catatanKehadiran.length > 0 ? (
                                    catatanKehadiran.map((catatan) => (
                                        <tr key={catatan.id_kehadiran} className="border-b border-gray-100">
                                            <td className="py-3 font-medium">{catatan.nama_pengguna}</td>
                                            <td className="py-3 text-gray-600 hidden lg:table-cell">{catatan.tanggal}</td>
                                            <td className="py-3 text-gray-600 hidden sm:table-cell">{catatan.jam_masuk || '-'}</td>
                                            <td className="py-3">
                          <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  catatan.status_kehadiran === 'Hadir'
                                      ? 'bg-green-100 text-green-800'
                                      : catatan.status_kehadiran === 'Telat'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                              }`}
                          >
                            {catatan.status_kehadiran}
                          </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-gray-500">
                                            Tidak ada data kehadiran untuk periode ini.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SupervisorDashboard;