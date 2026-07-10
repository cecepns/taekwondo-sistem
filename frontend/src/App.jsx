import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import { request } from './utils/request';
import { API_ENDPOINTS } from './utils/endpoints';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Dues from './pages/Dues';
import Coaches from './pages/Coaches';
import Attendance from './pages/Attendance';
import TrainingPrograms from './pages/TrainingPrograms';
import PhysicalTests from './pages/PhysicalTests';
import Championships from './pages/Championships';
import Settings from './pages/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  // Load user from localStorage
  const loadUser = () => {
    const savedUser = localStorage.getItem('tms_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  };

  // Fetch application branding / settings
  const fetchSettings = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.success) {
        setSettings(res.data);
        // Set dynamic primary color if available
        if (res.data?.main_color) {
          // Convert hex color to custom tailwind rgb color variable
          const hex = res.data.main_color;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          document.documentElement.style.setProperty('--primary', `${r} ${g} ${b}`);
        }
      }
    } catch (e) {
      console.error('Failed to load dynamic system settings', e);
    }
  };

  useEffect(() => {
    loadUser();
    fetchSettings();
    setIsLoading(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const token = localStorage.getItem('tms_token');
  const isLoginPage = location.pathname === '/login';

  // Auth Guard
  if (!token && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Handle Login redirection if already authenticated
  if (token && isLoginPage) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row light-theme">
      <Toaster position="top-right" reverseOrder={false} />
      
      {!isLoginPage && user && (
        <Sidebar user={user} settings={settings} />
      )}

      {/* Main content viewport */}
      <main className={`flex-1 min-w-0 p-4 md:p-8 pt-20 md:pt-8 transition-all ${
        !isLoginPage && user ? 'md:pl-72' : ''
      }`}>
        <Routes>
          <Route path="/login" element={<Login settings={settings} />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/dues" element={<Dues user={user} settings={settings} />} />
          <Route path="/coaches" element={<Coaches />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/programs" element={<TrainingPrograms />} />
          <Route path="/physical-tests" element={<PhysicalTests />} />
          <Route path="/championships" element={<Championships />} />
          <Route path="/settings" element={<Settings settings={settings} onSettingsChange={setSettings} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
