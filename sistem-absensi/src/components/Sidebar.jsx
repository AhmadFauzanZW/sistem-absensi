import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Pastikan path sesuai

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Definisikan menu untuk setiap peran
  const supervisorMenu = [
    { path: '/supervisor/dashboard', label: 'Dashboard' },
    { path: '/supervisor/absensi', label: 'Halaman Absensi' },
    { path: '/supervisor/validasi-izin', label: 'Validasi Izin' },
    { path: '/pengajuan-izin', label: 'Pengajuan Izin', roles: ['Pekerja', 'Supervisor', 'Manager'] },
    { path: '/riwayat-izin', label: 'Riwayat Izin', roles: ['Pekerja', 'Supervisor', 'Manager', 'Direktur'] },
  ];

  const pekerjaMenu = [
    { path: '/pekerja/profil', label: 'Profil & Dashboard' },
    { path: '/pengajuan-izin', label: 'Pengajuan Izin', roles: ['Pekerja', 'Supervisor', 'Manager'] },
    { path: '/riwayat-izin', label: 'Riwayat Izin', roles: ['Pekerja', 'Supervisor', 'Manager', 'Direktur'] },
    // { path: '/pekerja/izin', label: 'Pengajuan Izin' },
  ];

  const adminMenu = [
    { path: '/admin/dashboard', label: 'Dashboard Utama' },
    { path: '/pengajuan-izin', label: 'Pengajuan Izin', roles: ['Pekerja', 'Supervisor', 'Manager'] },
    { path: '/riwayat-izin', label: 'Riwayat Izin', roles: ['Pekerja', 'Supervisor', 'Manager', 'Direktur'] },
    // { path: '/admin/laporan', label: 'Laporan Proyek' },
    // { path: '/admin/kelola-pekerja', label: 'Kelola Pekerja' },
  ];

  let menuItems = [];
  if (user?.role === 'Supervisor') menuItems = supervisorMenu;
  if (user?.role === 'Pekerja') menuItems = pekerjaMenu;
  if (['Manager', 'Direktur'].includes(user?.role)) menuItems = adminMenu;

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 h-screen bg-gray-800 text-white flex flex-col transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0`}
    >
      {/* Header Sidebar */}
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Absensi Proyek</h1>
        {/* Tombol Close - hanya muncul di mobile */}
        <button onClick={toggleSidebar} className="text-white md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Menu Navigasi Dinamis Berdasarkan Role */}
      <nav className="flex-grow p-4">
        <ul className="space-y-2">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block px-4 py-2 rounded transition-colors ${
                    location.pathname.startsWith(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))
          ) : (
            <li>
              <span className="px-4 py-2 text-sm text-gray-500">Akses ditolak</span>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">© 2025 Absensi Proyek</p>
      </div>
    </div>
  );
};

export default Sidebar;