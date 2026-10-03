import React, { useState, useEffect } from 'react'; // 👇 TAMBAHAN: Jangan lupa import useEffect
import { LayoutDashboard, Clock, Users, Settings, Menu, X, FileText, CircleUser, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Psb from './pages/Psb';
import Lembur from './pages/Lembur';
import Absen from './pages/Absen';
import Login from './pages/Login';
import SettingsPage from './pages/SettingsPage';
import logoKantor from './assets/logo.png';
import simbolWatermark from './assets/simbol.jpg';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedSession = localStorage.getItem('user_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // 👇 TAMBAHAN 1: Cek apakah sebelumnya ada halaman yang sedang dibuka di memori browser. Kalau tidak ada, baru default ke 'dashboard'.
  const [activeMenu, setActiveMenu] = useState(() => {
    return localStorage.getItem('active_menu') || 'dashboard';
  });

  // 👇 TAMBAHAN 2: Efek ini akan otomatis menyimpan nama menu ke memori (localStorage) setiap kali kamu pindah halaman.
  useEffect(() => {
    localStorage.setItem('active_menu', activeMenu);
  }, [activeMenu]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  
  const handleLogout = () => { 
    localStorage.removeItem('user_session'); 
    localStorage.removeItem('active_menu'); // 👇 TAMBAHAN 3: Bersihkan juga memori halaman terakhir saat logout
    setCurrentUser(null); 
    setActiveMenu('dashboard'); 
  };

  if (!currentUser) return (
    <Login 
      onLoginSuccess={(userData) => {
        localStorage.setItem('user_session', JSON.stringify(userData));
        setCurrentUser(userData);
      }} 
    />
  );

  return (
    <div className="flex h-screen bg-[#F4F7FC] font-sans text-slate-900 overflow-hidden relative">
      {/* BACKGROUND WATERMARK */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center opacity-5 mix-blend-multiply overflow-hidden">
        <img src={simbolWatermark} alt="Watermark" className="w-[25rem] md:w-[35rem] lg:w-[45rem] object-contain blur-[3px]" />
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-[#394059]/60 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* SIDEBAR */}
      <aside className={`bg-[#394059] text-slate-300 w-64 flex-shrink-0 transition-transform duration-300 ease-in-out flex flex-col z-40 fixed inset-y-0 left-0 lg:relative ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="pt-8 pb-4 flex flex-col items-center justify-center relative">
        <div className="w-40 mb-3 flex items-center justify-center">
             <img src={logoKantor} alt="Logo" className="w-full h-auto object-contain drop-shadow-md" />
          </div>
          <p className="text-sm text-white font-medium tracking-wide">POP. Pacitan</p>
          <div className="w-4/5 h-px bg-white/20 mt-4 rounded-full"></div>
          <button onClick={toggleSidebar} className="absolute top-4 right-4 lg:hidden text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 pt-2 flex-1 overflow-y-auto">
          <nav className="space-y-1.5">
            <button onClick={() => { setActiveMenu('dashboard'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === 'dashboard' ? 'bg-[#01BFD7] text-white shadow-md font-semibold' : 'hover:bg-white/10 hover:text-white font-medium'}`}>
              <LayoutDashboard className="w-5 h-5" /> <span className="text-sm">Dashboard</span>
            </button>

            <button onClick={() => { setActiveMenu('psb'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === 'psb' ? 'bg-[#01BFD7] text-white shadow-md font-semibold' : 'hover:bg-white/10 hover:text-white font-medium'}`}>
              <FileText className="w-5 h-5" /> <span className="text-sm">Pemasangan (PSB)</span>
            </button>
            <button onClick={() => { setActiveMenu('lembur'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === 'lembur' ? 'bg-[#01BFD7] text-white shadow-md font-semibold' : 'hover:bg-white/10 hover:text-white font-medium'}`}>
              <Clock className="w-5 h-5" /> <span className="text-sm">Laporan Lembur</span>
            </button>

            <button onClick={() => { setActiveMenu('absen'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === 'absen' ? 'bg-[#01BFD7] text-white shadow-md font-semibold' : 'hover:bg-white/10 hover:text-white font-medium'}`}>
              <Users className="w-5 h-5" /> <span className="text-sm">Absensi Karyawan</span>
            </button>

            {currentUser.role === 'superadmin' && (
              <div className="pt-4 mt-4 border-t border-white/10">
                <button onClick={() => { setActiveMenu('settings'); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeMenu === 'settings' ? 'bg-[#01BFD7] text-white shadow-md font-semibold' : 'hover:bg-white/10 hover:text-white font-medium'}`}>
                  <Settings className="w-5 h-5" /> <span className="text-sm">Pengaturan Sistem</span>
                </button>
              </div>
            )}
          </nav>
        </div>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"><LogOut className="w-4 h-4" /> Keluar</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-5 py-4 flex items-center justify-between z-20 shadow-sm sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="text-slate-500 hover:text-[#01BFD7] transition-colors lg:hidden"><Menu className="w-6 h-6" /></button>
            <h2 className="text-[#394059] font-medium text-[15px] capitalize hidden sm:block">
              {activeMenu === 'psb' ? 'Pemasangan Perangkat Baru' : activeMenu === 'settings' ? 'Pengaturan Sistem' : activeMenu}
            </h2>
          </div>
          <div className="flex items-center">
            <div className="flex items-center gap-2 text-[#394059]">
              <CircleUser className="w-5 h-5 text-[#01BFD7]" />
              <span className="text-[13px] md:text-[14px] font-medium truncate max-w-[120px] md:max-w-[200px]">Hai, <span className="font-bold capitalize">{currentUser.role}</span> {currentUser.nama}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10 relative w-full">
          <div className="max-w-7xl mx-auto w-full">
            {activeMenu === 'dashboard' && <Dashboard currentRole={currentUser.role} />}
            {activeMenu === 'psb' && <Psb currentRole={currentUser.role} />}
            {activeMenu === 'lembur' && <Lembur currentRole={currentUser.role} />}
            {activeMenu === 'absen' && <Absen currentRole={currentUser.role} />}

            {/* Memanggil komponen SettingsPage */}
            {activeMenu === 'settings' && currentUser.role === 'superadmin' && (
              <SettingsPage currentRole={currentUser.role} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}