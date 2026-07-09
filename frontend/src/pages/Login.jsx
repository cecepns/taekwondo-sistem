import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { User, Lock, Loader2 } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Login({ settings }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      return toast.error('Harap masukkan username dan password');
    }

    setIsLoading(true);
    try {
      const response = await request.post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
      if (response.success) {
        localStorage.setItem('tms_token', response.data.token);
        localStorage.setItem('tms_user', JSON.stringify(response.data.user));
        toast.success(`Selamat datang kembali, ${response.data.user.name}!`);
        navigate('/');
      }
    } catch (err) {
      // Error is already toasted by request helper
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-slate-50">

      {/* Background Graphic elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center">
        <div className="mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img
              src={settings?.logo || logoImg}
              alt="TMS Logo"
              className="w-full h-full object-contain"
              onError={(e) => { e.target.src = logoImg }}
            />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{settings?.app_name || 'Taekwondo System'}</h2>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Sign in to manage your dojang operations</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                <Lock size={16} />
              </span>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        {/* <div className="mt-8 text-center border-t border-slate-100 pt-5 text-[11px] text-slate-450">
          Super Admin: <span className="text-slate-500 font-medium">superadmin</span> / <span className="text-slate-500 font-medium">admin123</span>
        </div> */}
      </div>
    </div>
  );
}
