import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { 
  Settings as SettingsIcon, Database, Download, Upload, Paintbrush, 
  MapPin, Phone, Mail, FileText
} from 'lucide-react';

export default function Settings({ settings, onSettingsChange }) {
  const [formData, setFormData] = useState({
    app_name: '',
    dojang_name: '',
    address: '',
    whatsapp: '',
    email: '',
    main_color: '#3b82f6',
    footer_text: '',
    default_dues_amount: 85000
  });

  const [restoreFile, setRestoreFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        app_name: settings.app_name || '',
        dojang_name: settings.dojang_name || '',
        address: settings.address || '',
        whatsapp: settings.whatsapp || '',
        email: settings.email || '',
        main_color: settings.main_color || '#3b82f6',
        footer_text: settings.footer_text || '',
        default_dues_amount: settings.default_dues_amount || 85000
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = new FormData();
    Object.keys(formData).forEach(k => payload.append(k, formData[k]));

    try {
      const res = await request.put(API_ENDPOINTS.SETTINGS.UPDATE, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        toast.success('Pengaturan sistem berhasil disimpan!');
        if (onSettingsChange) onSettingsChange(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackup = async (type) => {
    try {
      const token = localStorage.getItem('tms_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/backup/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tms_backup.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success(`Backup database (${type.toUpperCase()}) berhasil diunduh!`);
    } catch (err) {
      toast.error('Gagal mengunduh backup database');
    }
  };

  const handleRestore = async (e) => {
    e.preventDefault();
    if (!restoreFile) return toast.error('Pilih file backup JSON terlebih dahulu!');

    const payload = new FormData();
    payload.append('backup_file', restoreFile);

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.BACKUP.RESTORE, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.success) {
        toast.success('Database berhasil di-restore!');
        setRestoreFile(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Dojang & App settings Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon size={20} className="text-blue-500" /> Pengaturan Instansi Dojang
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nama Aplikasi</label>
                <input
                  type="text"
                  value={formData.app_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, app_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nama Dojang</label>
                <input
                  type="text"
                  value={formData.dojang_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, dojang_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">WhatsApp Official</label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Email Instansi</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-400">Nominal Iuran Default (Rp)</label>
                <input
                  type="number"
                  value={formData.default_dues_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, default_dues_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Alamat Lengkap Dojang</label>
              <textarea
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-400">Copyright Footer Text</label>
              <input
                type="text"
                value={formData.footer_text}
                onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Database Backup and Restore control center */}
      <div className="space-y-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Database size={20} className="text-blue-500" /> Database Backup
          </h2>

          <div className="space-y-3">
            <p className="text-[11px] text-slate-400 leading-normal">
              Unduh salinan data seluruh tabel database Taekwondo Management System dalam format SQL atau JSON terstruktur.
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => downloadBackup('sql')}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-colors"
              >
                <Download size={14} /> SQL Export
              </button>
              <button
                onClick={() => downloadBackup('json')}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-colors"
              >
                <Download size={14} /> JSON Backup
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Upload size={20} className="text-blue-500" /> Restore Database
          </h2>

          <form onSubmit={handleRestore} className="space-y-4 text-xs">
            <p className="text-[11px] text-slate-400 leading-normal">
              Kembalikan status database dengan mengunggah file cadangan backup `.json` sebelumnya.
            </p>
            
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files[0])}
              className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Upload size={14} /> Restore Sekarang
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
