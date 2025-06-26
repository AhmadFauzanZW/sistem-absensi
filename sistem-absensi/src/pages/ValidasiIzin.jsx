import { useState } from 'react';
import Layout from '../components/Layout';
import { pengajuanIzinList } from '../data/dummyData';

// Fungsi untuk menghitung durasi
const hitungDurasi = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Termasuk hari awal
};

const ValidasiIzin = () => {
  const [izinList, setIzinList] = useState(pengajuanIzinList);

  const handleAction = (izinId, newStatus) => {
    setIzinList(currentList =>
      currentList.map(izin =>
        izin.id === izinId ? { ...izin, status: newStatus } : izin
      )
    );
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Validasi Pengajuan Izin</h1>
      
      <div className="space-y-4">
        {izinList.map((izin) => (
          <div key={izin.id} className="bg-white p-5 rounded-lg shadow-md flex flex-col md:flex-row gap-4">
            
            {/* Kolom Informasi Utama */}
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-gray-800">{izin.namaPekerja}</p>
                  <p className="text-sm text-gray-500">ID: {izin.pekerjaId}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{izin.tanggalMulai} → {izin.tanggalSelesai}</p>
                  <p className="text-sm text-gray-500">Durasi: {hitungDurasi(izin.tanggalMulai, izin.tanggalSelesai)} hari</p>
                </div>
              </div>
              <p className="mt-3 text-gray-700 text-sm">{izin.alasan}</p>
            </div>

            {/* Kolom Aksi */}
            <div className="flex-shrink-0 flex flex-col md:items-end justify-center gap-3 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
              {izin.lampiranUrl && (
                <a href={izin.lampiranUrl} target="_blank" rel="noopener noreferrer" className="w-full md:w-35 text-center bg-gray-200 text-gray-700 px-3 py-2 text-sm rounded hover:bg-gray-300">
                  Lihat Lampiran
                </a>
              )}
              
              {/* Tombol Aksi / Status */}
              <div className="w-full flex md:justify-end gap-2">
                {izin.status === 'Menunggu Persetujuan' ? (
                  <>
                    <button onClick={() => handleAction(izin.id, 'Ditolak')} className="w-1/2 md:w-full bg-red-100 text-red-700 px-3 py-2 text-sm rounded hover:bg-red-200">Tolak</button>
                    <button onClick={() => handleAction(izin.id, 'Disetujui')} className="w-1/2 md:w-full bg-green-100 text-green-700 px-3 py-2 text-sm rounded hover:bg-green-200">Setujui</button>
                  </>
                ) : (
                  <span className={`w-full text-center px-4 py-2 text-sm font-bold rounded ${izin.status === 'Disetujui' ? 'bg-green-600 text-white md:w-35' : 'bg-red-600 text-white md:w-35'}`}>
                    {izin.status}
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ValidasiIzin;