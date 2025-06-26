import { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const PengajuanIzin = () => {
  const { user, izinList, ajukanIzin } = useAuth();
  // State untuk form
  const [tanggalMulai, setTanggalMulai] = useState('');
  const [tanggalSelesai, setTanggalSelesai] = useState('');
  const [alasan, setAlasan] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tanggalMulai || !tanggalSelesai || !alasan) {
      alert('Semua field wajib diisi!');
      return;
    }
    ajukanIzin({ tanggalMulai, tanggalSelesai, alasan, lampiranUrl: null });
    // Reset form
    setTanggalMulai('');
    setTanggalSelesai('');
    setAlasan('');
    alert('Pengajuan izin berhasil dikirim!');
  };

  const riwayatIzinPribadi = izinList.filter(i => i.pekerjaId === user.id);

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pengajuan & Riwayat Izin</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Pengajuan Izin */}
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4">Buat Pengajuan Izin Baru</h3>
            <form className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Rentang Tanggal</label>
                    <div className="flex gap-4">
                        <input
                            type="date"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                        <input
                            type="date"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Alasan</label>
                    <textarea
                        rows="3"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                    ></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium">Lampiran (Opsional)</label>
                    <input
                        type="file"
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                </div>
                <button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700"
                >
                    Kirim Pengajuan
                </button>
            </form>
        </div>

        {/* Kolom Riwayat */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="font-semibold text-lg mb-4">Riwayat Pengajuan Anda</h3>
          <div className="space-y-3">
            {riwayatIzinPribadi.length > 0 ? riwayatIzinPribadi.map(izin => (
              <div key={izin.id} className="border p-3 rounded-lg">
                <div className="flex justify-between">
                  <p><strong>{izin.tanggalMulai} s/d {izin.tanggalSelesai}</strong></p>
                  <p className={`font-bold text-sm ${izin.status === 'Disetujui' ? 'text-green-600' : izin.status === 'Ditolak' ? 'text-red-600' : 'text-yellow-600'}`}>{izin.status}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1">{izin.alasan}</p>
                <div className="text-xs mt-2 text-gray-500">
                  <p>Spv: {izin.persetujuan.supervisor || 'N/A'} | Mgr: {izin.persetujuan.manager || 'N/A'} | Dir: {izin.persetujuan.direktur || 'N/A'}</p>
                </div>
              </div>
            )) : <p>Belum ada riwayat pengajuan.</p>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PengajuanIzin;