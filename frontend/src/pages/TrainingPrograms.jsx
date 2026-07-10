import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { 
  Plus, Dumbbell, Clock, Target, Edit, Trash2, Printer, Calendar, ListTodo 
} from 'lucide-react';

export default function TrainingPrograms() {
  // Existing Master Programs (Exercise Database) state
  const [programs, setPrograms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tendangan',
    description: '',
    target: '',
    duration: ''
  });

  // Tabs
  const [activeTab, setActiveTab] = useState('sessions'); // 'database' or 'sessions'

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    program_name: '',
    date: new Date().toISOString().split('T')[0],
    items: []
  });

  const fetchPrograms = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST);
      if (res.success) setPrograms(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await request.get('/sessions');
      if (res.success) setSessions(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrograms();
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab]);

  // Master exercise CRUD helpers
  const startEditProgram = (p) => {
    setEditingProgram(p);
    setFormData({
      name: p.name,
      category: p.category || 'Tendangan',
      description: p.description || '',
      target: p.target || '',
      duration: p.duration || ''
    });
    setIsModalOpen(true);
  };

  const handleProgramDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus program latihan ini?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.PROGRAMS.DETAIL(id));
      if (res.success) {
        toast.success('Program latihan berhasil dihapus!');
        fetchPrograms();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus program latihan');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.duration) return toast.error('Lengkapi name dan durasi!');

    const payload = new FormData();
    Object.keys(formData).forEach(k => payload.append(k, formData[k]));

    setIsLoading(true);
    try {
      let res;
      if (editingProgram) {
        res = await request.put(API_ENDPOINTS.PROGRAMS.DETAIL(editingProgram.id), payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await request.post(API_ENDPOINTS.PROGRAMS.LIST, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      if (res.success) {
        toast.success(editingProgram ? 'Program latihan berhasil diperbarui!' : 'Program latihan berhasil ditambahkan!');
        setIsModalOpen(false);
        setEditingProgram(null);
        setFormData({ name: '', category: 'Tendangan', description: '', target: '', duration: '' });
        fetchPrograms();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sessions management helpers
  const startCreateSession = () => {
    setEditingSession(null);
    setSessionForm({
      program_name: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ program_id: '', name: '', description: '', duration: 0 }]
    });
    setIsSessionModalOpen(true);
  };

  const startEditSession = (session) => {
    setEditingSession(session);
    setSessionForm({
      program_name: session.program_name,
      date: new Date(session.date).toISOString().split('T')[0],
      items: session.items.map(item => ({
        program_id: item.program_id ? String(item.program_id) : '',
        name: item.name,
        description: item.description || '',
        duration: item.duration || 0
      }))
    });
    setIsSessionModalOpen(true);
  };

  const handleSelectExercise = (idx, programId) => {
    const prog = programs.find(p => p.id === parseInt(programId));
    setSessionForm(prev => {
      const updated = [...prev.items];
      if (prog) {
        // Parse minutes (e.g. "60 menit" -> 60)
        const mins = parseInt(prog.duration) || 0;
        updated[idx] = {
          program_id: programId,
          name: prog.name,
          description: prog.description || '',
          duration: mins
        };
      } else {
        updated[idx] = {
          program_id: '',
          name: '',
          description: '',
          duration: 0
        };
      }
      return { ...prev, items: updated };
    });
  };

  const updateSessionItem = (idx, field, value) => {
    setSessionForm(prev => {
      const updated = [...prev.items];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const addSessionItem = () => {
    setSessionForm(prev => ({
      ...prev,
      items: [...prev.items, { program_id: '', name: '', description: '', duration: 0 }]
    }));
  };

  const removeSessionItem = (idx) => {
    setSessionForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleSessionSubmit = async (e) => {
    e.preventDefault();
    if (!sessionForm.program_name || !sessionForm.date || sessionForm.items.length === 0) {
      return toast.error('Lengkapi judul program, tanggal, dan minimal 1 detail latihan!');
    }

    // Verify all items have names
    const hasInvalid = sessionForm.items.some(item => !item.name);
    if (hasInvalid) return toast.error('Semua baris latihan wajib memiliki nama jenis latihan!');

    setIsSessionLoading(true);
    try {
      let res;
      if (editingSession) {
        res = await request.put(`/sessions/${editingSession.id}`, sessionForm);
      } else {
        res = await request.post('/sessions', sessionForm);
      }
      if (res.success) {
        toast.success(editingSession ? 'Sesi latihan berhasil diperbarui!' : 'Sesi latihan berhasil dijadwalkan!');
        setIsSessionModalOpen(false);
        fetchSessions();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan sesi latihan');
    } finally {
      setIsSessionLoading(false);
    }
  };

  const handleSessionDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sesi latihan ini?')) return;
    try {
      const res = await request.delete(`/sessions/${id}`);
      if (res.success) {
        toast.success('Sesi latihan berhasil dihapus!');
        fetchSessions();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus sesi latihan');
    }
  };

  const getFormattedDateIndo = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const monthsIndo = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = monthsIndo[d.getMonth()];
    const yearNum = d.getFullYear();
    return `(${dayName} ${dateNum} ${monthName} ${yearNum})`;
  };

  const printSession = (session) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sesi Latihan - ${session.program_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #000; padding: 40px; text-align: center; }
            .header-title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.05em; }
            .header-date { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
            th, td { border: 1.5px solid #000; padding: 12px 10px; text-align: left; }
            th { text-align: center; font-weight: bold; background-color: #f5f5f5; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .duration-cell { font-size: 28px; font-weight: bold; text-align: center; vertical-align: middle; background-color: #fafafa; }
            .duration-label { font-size: 11px; font-weight: normal; letter-spacing: 0.1em; display: block; margin-top: 5px; color: #333; }
          </style>
        </head>
        <body>
          <div class="header-title">PROGRAM: ${session.program_name}</div>
          <div class="header-date">${getFormattedDateIndo(session.date)}</div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">NO</th>
                <th style="width: 220px;">JENIS LATIHAN</th>
                <th>KETERANGAN</th>
                <th style="width: 110px;" colspan="2">LAMA WAKTU</th>
                <th style="width: 140px;">LAMA LATIHAN</th>
              </tr>
            </thead>
            <tbody>
              ${session.items.map((item, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td class="bold" style="text-transform: uppercase;">${item.name}</td>
                  <td>${item.description || '-'}</td>
                  <td class="text-center" style="border-right: none; font-weight: bold; width: 45px; font-size: 14px;">${item.duration}</td>
                  <td class="text-center" style="border-left: none; width: 55px; color: #444;">menit</td>
                  ${idx === 0 ? `
                    <td class="duration-cell" rowspan="${session.items.length}">
                      <span style="font-size: 36px; display: block; line-height: 1;">${session.total_duration}</span>
                      <span class="duration-label">MENIT</span>
                    </td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalSessionFormDuration = sessionForm.items.reduce((acc, curr) => acc + (parseInt(curr.duration) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Program & Sesi Latihan</h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'database' 
              ? 'Kelola database acuan latihan dasar (pemanasan, teknik, fisik, dsb.)' 
              : 'Gabungkan beberapa jenis latihan database ke dalam 1 Sesi Jadwal Latihan'}
          </p>
        </div>
        {activeTab === 'database' ? (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Buat Program Acuan
          </button>
        ) : (
          <button 
            onClick={startCreateSession}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Buat Sesi Latihan
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'sessions' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <ListTodo size={14} /> Sesi & Jadwal Latihan
        </button>
        <button 
          onClick={() => setActiveTab('database')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'database' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Dumbbell size={14} /> Database Acuan Latihan
        </button>
      </div>

      {activeTab === 'database' ? (
        /* Database Acuan Latihan Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex-shrink-0">
                    <Dumbbell size={18} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[10px] uppercase font-bold">
                      {p.category}
                    </span>
                    <button 
                      onClick={() => startEditProgram(p)}
                      className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      onClick={() => handleProgramDelete(p.id)}
                      className="p-1 text-slate-400 hover:text-red-650 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm leading-snug">{p.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed truncate">{p.description || 'Tidak ada deskripsi'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock size={13} className="text-slate-400" />
                  <span>Durasi: {p.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Target size={13} className="text-slate-400" />
                  <span className="truncate" title={p.target}>Target: {p.target || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Sesi Latihan Tab */
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white p-12 text-center text-slate-500 border border-slate-200 rounded-2xl text-xs shadow-sm animate-fade-in">
              Belum ada jadwal sesi latihan yang disusun. Klik "Buat Sesi Latihan" untuk menjadwalkan.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {sessions.map(session => (
                <div key={session.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="space-y-2.5">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{session.program_name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={13} className="text-slate-400" />
                        {new Date(session.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {session.items.map((item, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[10px] rounded bg-slate-100 border border-slate-200 text-slate-650 font-medium whitespace-nowrap">
                          {item.name} ({item.duration}m)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between border-t border-slate-100 pt-3 md:pt-0 md:border-t-0">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-slate-450 block uppercase font-semibold tracking-wider">Durasi Total</span>
                      <strong className="text-sm font-bold text-blue-600">{session.total_duration} Menit</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => printSession(session)}
                        className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                        title="Print"
                      >
                        <Printer size={14} /> Cetak
                      </button>
                      <button 
                        onClick={() => startEditSession(session)}
                        className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-sm"
                        title="Edit"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleSessionDelete(session.id)}
                        className="p-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-650 transition-colors shadow-sm"
                        title="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Program Acuan Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingProgram(null); 
          setFormData({ name: '', category: 'Tendangan', description: '', target: '', duration: '' }); 
        }} 
        title={editingProgram ? "Edit Program Acuan" : "Buat Program Acuan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-650">
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Nama Program Latihan *</label>
            <input
              type="text"
              placeholder="Contoh: Pemanasan / Peregangan"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Kategori Latihan *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="Tendangan">Tendangan</option>
                <option value="Poomsae">Poomsae</option>
                <option value="Sparring">Sparring</option>
                <option value="Stamina">Stamina</option>
                <option value="Kecepatan">Kecepatan</option>
                <option value="Fleksibilitas">Fleksibilitas</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Target Durasi *</label>
              <input
                type="text"
                placeholder="Contoh: 10 menit"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Target Pencapaian *</label>
            <input
              type="text"
              placeholder="Contoh: Meregangkan otot kaki sebelum latihan utama"
              value={formData.target}
              onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Deskripsi Program Latihan</label>
            <textarea
              rows="3"
              placeholder="Jelaskan instruksi latihan detail..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
            >
              Simpan Program
            </button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Training Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title={editingSession ? "Edit Sesi Latihan" : "Rancang Sesi Latihan Baru"}
      >
        <form onSubmit={handleSessionSubmit} className="space-y-5 text-xs text-slate-650">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Nama Program Sesi *</label>
              <input 
                type="text"
                value={sessionForm.program_name}
                onChange={(e) => setSessionForm(prev => ({ ...prev, program_name: e.target.value }))}
                placeholder="Contoh: Latihan Hari Selasa"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Tanggal Sesi *</label>
              <input 
                type="date"
                value={sessionForm.date}
                onChange={(e) => setSessionForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-750 block">Detail Sesi Latihan (Rangkaian Program)</label>
              <button
                type="button"
                onClick={addSessionItem}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-blue-600 font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
              >
                + Tambah Baris
              </button>
            </div>

            <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
              {sessionForm.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
                    
                    {/* Database Program Dropdown */}
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Pilih dari Database</label>
                      <select
                        value={item.program_id}
                        onChange={(e) => handleSelectExercise(idx, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 text-[11px] focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">-- Kustom / Baru --</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.duration})</option>
                        ))}
                      </select>
                    </div>

                    {/* Exercise Name */}
                    <div className="space-y-1 md:col-span-5">
                      <label className="text-[10px] text-slate-550 font-semibold block mb-0.5">Nama Jenis Latihan *</label>
                      <input 
                        type="text"
                        placeholder="Nama latihan"
                        value={item.name}
                        onChange={(e) => updateSessionItem(idx, 'name', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-[11px] focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Duration in minutes */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-slate-550 font-semibold block mb-0.5">Menit *</label>
                      <input 
                        type="number"
                        placeholder="Durasi"
                        value={item.duration}
                        onChange={(e) => updateSessionItem(idx, 'duration', parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-800 text-[11px] font-semibold text-center focus:border-blue-500 focus:outline-none"
                        required
                      />
                    </div>

                    {/* Remove button */}
                    <div className="md:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => removeSessionItem(idx)}
                        disabled={sessionForm.items.length === 1}
                        className="p-1.5 text-slate-450 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Keterangan description */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-550 font-semibold block">Keterangan / Detail Gerakan</label>
                    <input 
                      type="text"
                      placeholder="Instruksi tambahan..."
                      value={item.description}
                      onChange={(e) => updateSessionItem(idx, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-slate-700 text-[11px] focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total Duration Footer Summary */}
            <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <span className="font-semibold text-blue-600">ESTIMASI TOTAL WAKTU LATIHAN</span>
              <span className="font-bold text-blue-700 text-sm">{totalSessionFormDuration} MENIT</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-655 hover:bg-slate-200 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSessionLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
            >
              {isSessionLoading ? 'Menyimpan Sesi...' : (editingSession ? 'Simpan Perubahan Sesi' : 'Jadwalkan Sesi')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
