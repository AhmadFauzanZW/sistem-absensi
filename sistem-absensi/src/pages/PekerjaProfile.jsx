// src/pages/PekerjaProfile.jsx

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { riwayatKehadiranPekerja, pengajuanIzinList } from '../data/dummyData';
import CalendarView from '../components/CalendarView';

const PekerjaProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'izin'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  // Hitung data dashboard
  const totalHadir = riwayatKehadiranPekerja.filter(h => h.status === 'Hadir' || h.status === 'Terlambat').length;
  const gajiHarian = user?.gaji_harian || 150000;
  const estimasiGaji = totalHadir * gajiHarian;

  return (
    <Layout>
      {/* Header Profil */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 flex items-center gap-6">
        <img 
          src={user?.foto_profil || 'https://placehold.co/100x100 '} 
          alt="Foto Profil" 
          className="w-24 h-24 rounded-full border-4 border-blue-200 object-cover"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{user?.name || 'Nama Pekerja'}</h1>
          <p className="text-lg text-gray-600">{user?.jabatan || 'Jabatan'}</p>
          <p className="text-sm text-gray-500">ID: {user?.id || 'P00X'}</p>
        </div>
      </div>

      {/* Navigasi Tab */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard & Riwayat
            </button>
            <button
              onClick={() => setActiveTab('izin')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'izin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pengajuan Izin
            </button>
          </nav>
        </div>
      </div>

      {/* Konten Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kalkulasi Gaji */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="font-semibold text-lg mb-2">Estimasi Pendapatan Bulan Ini</h3>
              <p className="text-4xl font-bold text-green-600">Rp {estimasiGaji.toLocaleString('id-ID')}</p>
              <p className="text-sm text-gray-500 mt-2">
                {totalHadir} hari kerja x Rp {gajiHarian.toLocaleString('id-ID')}
              </p>
            </div>
            {/* Bisa tambahkan widget lain di sini */}
          </div>

          {/* Kolom Riwayat Kehadiran */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Riwayat Kehadiran Terakhir</h3>
              <div className='flex items-center space-x-2'>
                <div>Tampilan:</div>
                <button
                  onClick={() => setViewMode('list')}
                  className={`cursor-pointer w-fit p-2 bg-gray-200 rounded ${viewMode === 'list' ? 'text-blue-500 font-bold' : ''}`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`cursor-pointer w-fit p-2 bg-gray-200 rounded ${viewMode === 'calendar' ? 'text-blue-500 font-bold' : ''}`}
                >
                  Kalender
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2">
                    <th className="py-2">Tanggal</th>
                    <th className="py-2">Jam Masuk</th>
                    <th className="py-2">Jam Keluar</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {riwayatKehadiranPekerja.map((h, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3">{h.tanggal}</td>
                      <td>{h.jamMasuk || '-'}</td>
                      <td>{h.jamKeluar || '-'}</td>
                      <td>{h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <CalendarView attendanceData={riwayatKehadiranPekerja} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'izin' && (
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

          {/* Riwayat Pengajuan Izin */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-4">Riwayat Pengajuan Izin Anda</h3>
            <div className="space-y-3">
              {pengajuanIzinList
                .filter((izin) => izin.pekerjaId === user.id)
                .map((izin) => (
                  <div key={izin.id} className="border p-3 rounded">
                    <p>
                      <strong>{izin.tanggalMulai} - {izin.tanggalSelesai}</strong>
                    </p>
                    <p className="text-sm">{izin.alasan}</p>
                    <p className="text-sm font-bold">Status: {izin.status}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PekerjaProfile;