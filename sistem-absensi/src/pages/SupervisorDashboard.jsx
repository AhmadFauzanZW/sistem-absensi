import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { id as indonesianLocale } from 'date-fns/locale';

import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

// Komponen Grafik Dinamis (dari jawaban sebelumnya, sedikit disesuaikan)
const DynamicChart = ({ chartData }) => {
    if (!chartData || !chartData.type) return <div className="h-full flex justify-center items-center text-gray-400">Pilih filter untuk melihat grafik...</div>;

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            tooltip: { mode: 'index', intersect: false },
        },
        scales: (chartData.type === 'bar' || chartData.type === 'line') ? {
            x: { stacked: chartData.type === 'bar' }, // Tumpuk batang untuk perbandingan
            y: { stacked: chartData.type === 'bar', beginAtZero: true }
        } : undefined,
    };

    const data = {
        labels: chartData.labels,
        // Langsung gunakan datasets dari backend
        datasets: chartData.datasets,
    };

    if (chartData.type === 'bar') return <Bar options={options} data={data} />;
    if (chartData.type === 'line') return <Line options={options} data={data} />;
    if (chartData.type === 'pie') return <Pie options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} data={data} />;
    return null;
};

const SupervisorDashboard = () => {
    const [summary, setSummary] = useState({});
    const [trendData, setTrendData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [displayPeriod, setDisplayPeriod] = useState(''); // Untuk label periode yang jelas
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk kontrol filter
    const [filter, setFilter] = useState('hari');
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const params = {
                    filter,
                    date: selectedDate.toISOString().split('T')[0], // Format YYYY-MM-DD
                    page: pagination.currentPage,
                };

                const summaryPromise = axios.get('http://localhost:5000/api/dashboard/summary', { headers, params: { filter: params.filter, date: params.date } });
                const activitiesPromise = axios.get('http://localhost:5000/api/dashboard/activities', { headers, params });

                const [summaryRes, activitiesRes] = await Promise.all([summaryPromise, activitiesPromise]);

                setSummary(summaryRes.data.summary);
                setTrendData(summaryRes.data.trendData);
                setDisplayPeriod(summaryRes.data.displayPeriod); // Ambil label periode dari backend
                setActivities(activitiesRes.data.activities);
                setPagination(activitiesRes.data.pagination);
            } catch (err) {
                console.error('Gagal mengambil data dashboard:', err);
                setError('Gagal memuat data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, selectedDate, pagination.currentPage]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSelectedDate(new Date()); // Reset tanggal ke hari ini
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    return (
        <Layout>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Dashboard Supervisor</h1>
                    <p className="text-gray-500">Menampilkan data untuk: <span className="font-semibold text-blue-600">{displayPeriod}</span></p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                    {/* Kontrol Filter Baru */}
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleDateChange}
                        dateFormat={filter === 'bulan' ? 'MMMM yyyy' : 'dd MMMM yyyy'}
                        showMonthYearPicker={filter === 'bulan'}
                        locale={indonesianLocale}
                        className="w-48 p-2 border rounded-lg text-center"
                    />
                    <button onClick={() => handleFilterChange('hari')} className={`px-4 py-2 text-sm font-medium rounded cursor-pointer ${filter === 'hari' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Harian</button>
                    <button onClick={() => handleFilterChange('minggu')} className={`px-4 py-2 text-sm font-medium rounded cursor-pointer ${filter === 'minggu' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Mingguan</button>
                    <button onClick={() => handleFilterChange('bulan')} className={`px-4 py-2 text-sm font-medium rounded cursor-pointer ${filter === 'bulan' ? 'bg-blue-600 text-white' : 'bg-white'}`}>Bulanan</button>
                </div>
                <Link to="/supervisor/absensi" className="bg-green-600 text-white px-6 py-3 rounded font-bold hover:bg-green-700 shadow-lg">Mulai Sesi Absensi</Link>
            </div>

            {/* Kartu Statistik dengan Flex Wrap */}
            <div className="flex flex-wrap gap-4 mb-6 ">
                <StatCard title="Total Aktif" value={summary.total_pekerja || 0} icon="👥" />
                <StatCard title="Hadir" value={summary.hadir || 0} icon="✅" />
                <StatCard title="Terlambat" value={summary.terlambat || 0} icon="⚠️" />
                <StatCard title="Izin" value={summary.izin || 0} icon="📝" />
                <StatCard title="Lembur" value={summary.lembur || 0} icon="💼" />
                <StatCard title="Pulang Cepat" value={summary.pulang_cepat || 0} icon="🏃‍♂️" />
                <StatCard title="Absen" value={summary.absen ?? 0} icon="❌" />
            </div>

            {/* Layout Baru untuk Grafik dan Tabel */}
            <div className="flex flex-col gap-6">
                {/* Grafik (Sekarang di atas, full-width) */}
                <div className="bg-white p-6 rounded-lg shadow-md w-full">
                    <h2 className="text-xl font-semibold mb-4">{trendData?.title || 'Grafik Kehadiran'}</h2>
                    <div className="h-80">
                        <DynamicChart chartData={trendData} />
                    </div>
                </div>

                {/* Tabel Aktivitas */}
                <div className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                    <h2 className="text-xl font-semibold mb-4">Aktivitas Kehadiran Terbaru</h2>
                    {loading && <div className="text-center p-4">Memuat...</div>}
                    {!loading && error && <div className="text-center p-4 text-red-500">{error}</div>}
                    {!loading && !error && (
                        <>
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left">
                                    {/* ... thead dan tbody sama seperti sebelumnya ... */}
                                    <thead className="border-b-2 border-gray-200">
                                        <tr>
                                            <th className="py-2 px-3">Nama Pekerja</th>
                                            <th className="py-2 px-3">Tanggal</th>
                                            <th className="py-2 px-3">Jam Masuk</th>
                                            <th className="py-2 px-3">Jam Pulang</th>
                                            <th className="py-2 px-3">Total Jam Kerja</th>
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
                                                    <td className="py-3 px-3 font-semibold">{activity.total_jam_kerja || '-'}</td>
                                                    <td className="py-3 px-3">
                                                      <span
                                                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                              activity.status_kehadiran === 'Hadir' ? 'bg-green-100 text-green-800' :
                                                              activity.status_kehadiran === 'Telat' ? 'bg-yellow-100 text-yellow-800' :
                                                              activity.status_kehadiran === 'Izin' ? 'bg-cyan-100 text-cyan-800' :
                                                              activity.status_kehadiran === 'Lembur' ? 'bg-indigo-100 text-indigo-800' :
                                                              activity.status_kehadiran === 'Pulang Cepat' ? 'bg-orange-100 text-orange-800' :
                                                              activity.status_kehadiran === 'Absen' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}
                                                      >
                                                          {activity.status_kehadiran}
                                                      </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center py-6 text-gray-500">Tidak ada data kehadiran untuk periode ini.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                    <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Sebelumnya</button>
                                    <span className="text-sm text-gray-600">Halaman {pagination.currentPage} dari {pagination.totalPages}</span>
                                    <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} className="px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50">Berikutnya</button>
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