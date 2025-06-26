import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { lokasiProyekList, logAktivitas, pengajuanIzinList } from '../data/dummyData';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [lokasiTerpilih, setLokasiTerpilih] = useState('semua');
  
  // Filter izin yang butuh persetujuan Manager (layer 2)
  const izinUntukManager = pengajuanIzinList.filter(i => i.status === 'Menunggu Persetujuan'); // Dalam sistem nyata, ini seharusnya 'Disetujui Supervisor'

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard {user.role}</h1>
        {user.role === 'Manager' && (
          <div>
            <label className="text-sm mr-2">Lokasi Proyek:</label>
            <select onChange={(e) => setLokasiTerpilih(e.target.value)} className="border-gray-300 rounded-md shadow-sm">
              <option value="semua">Semua Lokasi</option>
              {lokasiProyekList.map(l => <option key={l.id} value={l.id}>{l.nama}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* --- KONTEN KHUSUS MANAGER --- */}
      {user.role === 'Manager' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="font-semibold text-lg mb-4">Izin Membutuhkan Persetujuan Anda</h2>
            {izinUntukManager.length > 0 ? (
                <div className="space-y-3">
                    {izinUntukManager.map(izin => (
                        <div key={izin.id} className="border p-3 rounded flex justify-between items-center">
                            <div>
                                <p><strong>{izin.namaPekerja}</strong> ({izin.tanggalMulai})</p>
                                <p className="text-sm">{izin.alasan}</p>
                            </div>
                            <div className="flex gap-2">
                                <button className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm">Tolak</button>
                                <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm">Setujui</button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-500">Tidak ada pengajuan izin yang membutuhkan persetujuan.</p>}
        </div>
      )}
      
      {/* --- KONTEN KHUSUS DIREKTUR (SUPER-USER) --- */}
      {user.role === 'Direktur' && (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="font-semibold text-lg mb-4">Log Aktivitas Pengguna</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead><tr className="border-b-2"><th className="py-2">Waktu</th><th className="py-2">Pengguna</th><th className="py-2">Aksi</th><th className="py-2">Deskripsi</th></tr></thead>
                    <tbody>
                        {logAktivitas.map((log, i) => (
                            <tr key={i} className="border-b">
                                <td className="py-2 pr-4 whitespace-nowrap">{log.timestamp}</td>
                                <td className="py-2 pr-4">{log.user} ({log.role})</td>
                                <td className="py-2 pr-4"><span className="bg-gray-200 px-2 py-1 rounded-full text-xs">{log.action}</span></td>
                                <td className="py-2">{log.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Di sini, Anda bisa menambahkan komponen dashboard lain yang bisa dilihat oleh Manager & Direktur */}
      <div className="mt-6">
        <p className="text-gray-600">Analitik dan ringkasan data dari lokasi <strong>{lokasiTerpilih === 'semua' ? 'semua proyek' : lokasiProyekList.find(l => l.id === lokasiTerpilih).nama}</strong> akan ditampilkan di sini.</p>
      </div>

    </Layout>
  );
};

export default AdminDashboard;