import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Halaman
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import SupervisorDashboard from './pages/SupervisorDashboard';
import HalamanAbsensi from './pages/HalamanAbsensi';
import ValidasiIzin from './pages/ValidasiIzin';
import PengajuanIzin from './pages/PengajuanIzin';
import PekerjaProfile from './pages/PekerjaProfile'; // Profil pekerja nyata
import AdminDashboard from './pages/AdminDashboard'; // Dashboard admin/direktur nyata
import UnauthorizedPage from './pages/UnauthorizedPage'; // Halaman 403

// Placeholder (opsional)
const PekerjaDashboard = () => <h1 className="p-4">Halaman Dashboard Pekerja</h1>;

// Komponen untuk redirect otomatis berdasarkan role pengguna
const AppRoutes = () => {
  const { user } = useAuth();

  if (user) {
    if (['Supervisor', 'Manager', 'Direktur'].includes(user.role)) {
      return <Navigate to="/supervisor/dashboard" />;
    }
    if (user.role === 'Pekerja') {
      return <Navigate to="/pekerja/profil" />;
    }
  }

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

          {/* Rute Admin / Direktur / Manager */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Manager', 'Direktur']}>
                <AdminDashboard />
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