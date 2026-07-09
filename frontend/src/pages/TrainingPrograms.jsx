import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { Plus, Dumbbell, Clock, Compass, Target, HelpCircle, Edit, Trash2 } from 'lucide-react';

export default function TrainingPrograms() {
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

  const fetchPrograms = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.PROGRAMS.LIST);
      if (res.success) setPrograms(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Master Program Latihan</h2>
          <p className="text-xs text-slate-400">Rancang dan jadwalkan kurikulum latihan mandiri</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Buat Program
        </button>
      </div>

      {/* Program cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {programs.map(p => (
          <div key={p.id} className="glass-panel p-5 rounded-2xl border border-slate-200 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex-shrink-0">
                  <Dumbbell size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-[10px] uppercase font-bold">
                    {p.category}
                  </span>
                  <button 
                    onClick={() => startEditProgram(p)}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleProgramDelete(p.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-sm leading-snug">{p.name}</h3>
                <p className="text-xs text-slate-450 leading-relaxed truncate">{p.description || 'Tidak ada deskripsi'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3.5 grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock size={13} className="text-slate-500" />
                <span>Durasi: {p.duration}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Target size={13} className="text-slate-500" />
                <span className="truncate" title={p.target}>Target: {p.target || '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Program Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingProgram(null); 
          setFormData({ name: '', category: 'Tendangan', description: '', target: '', duration: '' }); 
        }} 
        title={editingProgram ? "Edit Program Latihan" : "Buat Program Latihan Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Nama Program Latihan *</label>
            <input
              type="text"
              placeholder="Contoh: Latihan Tendangan Dollyo Chagi"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kategori Latihan *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
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
              <label className="font-semibold text-slate-300">Target Durasi *</label>
              <input
                type="text"
                placeholder="Contoh: 60 menit"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Target Pencapaian *</label>
            <input
              type="text"
              placeholder="Contoh: Kecepatan tendangan membaik"
              value={formData.target}
              onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Deskripsi Program Latihan</label>
            <textarea
              rows="3"
              placeholder="Jelaskan instruksi latihan detail..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg"
            >
              Simpan Program
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
