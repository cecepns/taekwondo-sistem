import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, UserSquare2, ShieldAlert, BadgeCent, 
  Clock, Dumbbell, Award, ClipboardCheck, Settings, LogOut, Menu, X, Database
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Sidebar({ user, settings }) {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    // Call handler immediately on mount to set accurate state
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'finance'] },
    { name: 'Anggota', path: '/members', icon: Users, roles: ['super_admin', 'admin'] },
    { name: 'Pelatih', path: '/coaches', icon: UserSquare2, roles: ['super_admin'] },
    { name: 'Iuran Keuangan', path: '/dues', icon: BadgeCent, roles: ['super_admin', 'admin', 'finance'] },
    { name: 'Absensi Latihan', path: '/attendance', icon: Clock, roles: ['super_admin', 'admin'] },
    { name: 'Program Latihan', path: '/programs', icon: Dumbbell, roles: ['super_admin'] },
    { name: 'Hasil Tes Fisik', path: '/physical-tests', icon: ClipboardCheck, roles: ['super_admin', 'admin'] },
    { name: 'Championships', path: '/championships', icon: Award, roles: ['super_admin', 'admin'] },
    { name: 'Pengaturan Sistem', path: '/settings', icon: Settings, roles: ['super_admin'] }
  ];

  const allowedMenuItems = menuItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 p-2 bg-white border border-slate-200 rounded-lg text-slate-600 md:hidden hover:bg-slate-50 transition-colors"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ${
        isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-20 md:translate-x-0'
      }`}>
        {/* Header Branding */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-100 overflow-hidden">
          <img 
            src={settings?.logo || logoImg} 
            alt="TMS Logo" 
            className="w-10 h-10 object-contain rounded-lg flex-shrink-0"
            onError={(e) => { e.target.src = logoImg }}
          />
          <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            <h1 className="font-bold text-sm leading-tight text-slate-800">{settings?.dojang_name || 'Dojang Taekwondo'}</h1>
            <span className="text-xs text-blue-600 font-medium">Taekwondo System</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-blue-600/10 text-blue-600 font-semibold flex items-center justify-center flex-shrink-0 border border-blue-100">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              <h4 className="text-xs font-semibold text-slate-800 truncate w-36">{user?.name}</h4>
              <span className="text-[10px] text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {allowedMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
                className={({ isActive }) => `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              Keluar
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
