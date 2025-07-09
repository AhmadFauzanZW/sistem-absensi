import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Halaman
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import SupervisorDashboard from './pages/SupervisorDashboard';
import HalamanAbsensi from './pages/HalamanAbsensi';
import ValidasiIzin from './pages/ValidasiIzin';
import PengajuanIzin from './pages/PengajuanIzin';
import RiwayatIzin from './pages/RiwayatIzin';
import PekerjaProfile from './pages/PekerjaProfile'; // Profil pekerja nyata
import ManagerDashboard from './pages/ManagerDashboard.jsx'; // Dashboard Manager
import DirekturDashboard from './pages/DirekturDashboard'; // Dashboard Direktur
import UnauthorizedPage from './pages/UnauthorizedPage'; // Halaman 403

// Placeholder (opsional)
const PekerjaDashboard = () => <h1 className="p-4">Halaman Dashboard Pekerja</h1>;
const KelolaPekerja = () => <Layout><h1 className="p-4 text-2xl">Halaman Kelola Pekerja (Dalam Pengembangan)</h1></Layout>;
const LaporanProyek = () => <Layout><h1 className="p-4 text-2xl">Halaman Laporan Proyek (Dalam Pengembangan)</h1></Layout>;

// Komponen untuk redirect otomatis berdasarkan role pengguna
const AppRoutes = () => {
    const { user } = useAuth();

    if (user) {
        // Periksa peran dari yang paling spesifik/tinggi
        if (user.role === 'Direktur') {
            return <Navigate to="/direktur/dashboard" />;
        }
        if (user.role === 'Manager') {
            return <Navigate to="/manager/dashboard" />;
        }
        if (user.role === 'Supervisor') {
            return <Navigate to="/supervisor/dashboard" />;
        }
        if (user.role === 'Pekerja') {
            return <Navigate to="/pekerja/profil" />;
        }
    }

    // Jika tidak ada peran yang cocok atau belum login
    return <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rute Utama */}
          <Route path="/" element={<AppRoutes />} />

          {/* Rute Publik */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
              path="/riwayat-izin"
              element={
                  <ProtectedRoute allowedRoles={['Pekerja', 'Supervisor', 'Manager', 'Direktur']}>
                      <RiwayatIzin />
                  </ProtectedRoute>
              }
          />
          {/*  Rute Bersama kecuali Direktur untuk Pengajuan Izin Cuti */}
          <Route
              path="/pengajuan-izin"
              element={
                  <ProtectedRoute allowedRoles={['Pekerja', 'Supervisor', 'Manager']}>
                      <PengajuanIzin />
                  </ProtectedRoute>
              }
          />
          {/* Rute Supervisor */}
          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Supervisor', 'Manager', 'Direktur']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/absensi"
            element={
              <ProtectedRoute allowedRoles={['Supervisor']}>
                <HalamanAbsensi />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/validasi-izin"
            element={
              <ProtectedRoute allowedRoles={['Supervisor', 'Manager']}>
                <ValidasiIzin />
              </ProtectedRoute>
            }
          />

          {/* Rute Pekerja */}
          <Route
            path="/pekerja/profil"
            element={
              <ProtectedRoute allowedRoles={['Pekerja']}>
                <PekerjaProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pekerja/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Pekerja']}>
                <PekerjaDashboard />
              </ProtectedRoute>
            }
          />

          {/* Rute Manager */}
          <Route
            path="/manager/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Manager', 'Direktur']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
              path="/manager/kelola-pekerja"
              element={
                  <ProtectedRoute allowedRoles={['Manager']}>
                      <KelolaPekerja />
                  </ProtectedRoute>
              }
          />
          <Route
              path="/manager/laporan"
              element={
                  <ProtectedRoute allowedRoles={['Manager']}>
                      <LaporanProyek />
                  </ProtectedRoute>
              }
          />

          {/* Rute Direktur */}
          <Route
              path="/direktur/dashboard"
              element={
                  <ProtectedRoute allowedRoles={['Direktur']}>
                      <DirekturDashboard />
                  </ProtectedRoute>
              }
          />


          {/* Fallback - 404 Page Not Found */}
          <Route path="*" element={<h1 className="text-center text-2xl mt-10">404 - Halaman Tidak Ditemukan</h1>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;