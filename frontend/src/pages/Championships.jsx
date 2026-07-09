import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { 
  Plus, Award, MapPin, Calendar, Users, ShieldAlert, BadgeAlert,
  Edit, Trash2
} from 'lucide-react';

export default function Championships() {
  const [championships, setChampionships] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [belts, setBelts] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingChampionship, setEditingChampionship] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);

  // Participant Form state
  const [partForm, setPartForm] = useState({
    championship_id: '',
    member_id: '',
    match_number: '',
    category: '',
    belt_id: '',
    weight: '',
    target_medal: 'Emas'
  });

  // Weight validation feedback
  const [weightWarning, setWeightWarning] = useState('');

  // Championship Form state
  const [champForm, setChampForm] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    organizer: '',
    level: 'internal',
    description: ''
  });

  const fetchData = async () => {
    try {
      const chRes = await request.get(API_ENDPOINTS.CHAMPIONSHIPS.LIST);
      const partRes = await request.get(API_ENDPOINTS.CHAMPIONSHIPS.PARTICIPANTS_LIST);
      const membersRes = await request.get(API_ENDPOINTS.MEMBERS.LIST);
      const beltsRes = await request.get(API_ENDPOINTS.BELTS.LIST);

      if (chRes.success) setChampionships(chRes.data);
      if (partRes.success) setParticipants(partRes.data);
      if (membersRes.success) setMembers(membersRes.data);
      if (beltsRes.success) setBelts(beltsRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check Weight Limit automatically when member_id or category changes
  useEffect(() => {
    async function checkWeightLimit() {
      if (!partForm.member_id || !partForm.category) {
        setWeightWarning('');
        return;
      }
      try {
        const res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.VALIDATE_WEIGHT, {
          member_id: partForm.member_id,
          category: partForm.category
        });
        if (res.success && !res.valid) {
          setWeightWarning(res.warning);
        } else {
          setWeightWarning('');
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkWeightLimit();
  }, [partForm.member_id, partForm.category]);

  const startEditChampionship = (c) => {
    setEditingChampionship(c);
    setChampForm({
      name: c.name,
      location: c.location || '',
      date: new Date(c.date).toISOString().split('T')[0],
      organizer: c.organizer || '',
      level: c.level || 'internal',
      description: c.description || ''
    });
    setIsModalOpen(true);
  };

  const handleChampionshipDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kejuaraan ini? Semua peserta yang terdaftar di turnamen ini juga akan dihapus.')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.CHAMPIONSHIPS.DETAIL(id));
      if (res.success) {
        toast.success('Kejuaraan berhasil dihapus!');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus kejuaraan');
    }
  };

  const startEditParticipant = (p) => {
    setEditingParticipant(p);
    setPartForm({
      championship_id: p.championship_id,
      member_id: p.member_id,
      match_number: p.match_number || '',
      category: p.category || '',
      belt_id: p.belt_id || '',
      weight: p.weight || '',
      target_medal: p.target_medal || 'Emas',
      medal: p.medal || ''
    });
    setIsRegOpen(true);
  };

  const handleParticipantDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus peserta ini dari turnamen?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.CHAMPIONSHIPS.PARTICIPANTS_DETAIL(id));
      if (res.success) {
        toast.success('Peserta berhasil dihapus dari turnamen!');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus peserta');
    }
  };

  const handleChampSubmit = async (e) => {
    e.preventDefault();
    if (!champForm.name || !champForm.location) return toast.error('Harap lengkapi form event!');

    setIsLoading(true);
    try {
      let res;
      if (editingChampionship) {
        res = await request.put(API_ENDPOINTS.CHAMPIONSHIPS.DETAIL(editingChampionship.id), champForm);
      } else {
        res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.LIST, champForm);
      }
      if (res.success) {
        toast.success(editingChampionship ? 'Kejuaraan berhasil diperbarui!' : 'Kejuaraan berhasil ditambahkan!');
        setIsModalOpen(false);
        setEditingChampionship(null);
        setChampForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], organizer: '', level: 'internal', description: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParticipantSubmit = async (e) => {
    e.preventDefault();
    if (!partForm.championship_id || !partForm.member_id || !partForm.category) {
      return toast.error('Lengkapi semua kolom wajib!');
    }

    // Auto get member weight if empty
    let finalWeight = partForm.weight;
    if (!finalWeight) {
      const selectedMember = members.find(m => m.id === parseInt(partForm.member_id));
      if (selectedMember) finalWeight = selectedMember.weight;
    }

    setIsLoading(true);
    try {
      let res;
      if (editingParticipant) {
        res = await request.put(API_ENDPOINTS.CHAMPIONSHIPS.PARTICIPANTS_DETAIL(editingParticipant.id), {
          ...partForm,
          weight: finalWeight
        });
      } else {
        res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.PARTICIPANTS_CREATE, {
          ...partForm,
          weight: finalWeight
        });
      }
      if (res.success) {
        toast.success(editingParticipant ? 'Data peserta berhasil diperbarui!' : 'Atlet berhasil didaftarkan ke turnamen!');
        setIsRegOpen(false);
        setEditingParticipant(null);
        setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' });
        setWeightWarning('');
        fetchData();
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Pendaftaran & Hasil Championship</h2>
          <p className="text-xs text-slate-400">Kelola ajang kompetisi, kualifikasi kelas berat, dan medali atlet</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsRegOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Users size={14} /> Daftar Peserta
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Buat Kejuaraan
          </button>
        </div>
      </div>

      {/* Main events grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {championships.map(c => (
          <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="px-2.5 py-0.5 rounded bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold uppercase text-[9px] tracking-wider">
                  Level {c.level}
                </span>
                <span className="text-[10px] text-slate-500">{new Date(c.date).toLocaleDateString('id-ID')}</span>
              </div>
              
              <h3 className="font-bold text-slate-100 text-sm leading-snug">{c.name}</h3>
              <p className="text-xs text-slate-450 leading-relaxed">{c.description || 'Tidak ada deskripsi'}</p>
            </div>

            <div className="border-t border-slate-850 pt-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-500" /> {c.location}</span>
                <span className="flex items-center gap-1"><Award size={13} className="text-slate-500" /> Penyelenggara: {c.organizer}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => startEditChampionship(c)}
                  className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleChampionshipDelete(c.id)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Hapus"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Participants list */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-semibold text-sm text-slate-200 pb-2 border-b border-slate-800">Daftar Atlet Turnamen</h3>
        
        {participants.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Belum ada atlet terdaftar dalam turnamen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-2">Atlet</th>
                  <th className="py-3 px-2">Kejuaraan</th>
                  <th className="py-3 px-2">Kategori Tanding</th>
                  <th className="py-3 px-2">No Tanding</th>
                  <th className="py-3 px-2">Target Medali</th>
                  <th className="py-3 px-2">Hasil Medali</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {participants.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-2 font-medium text-slate-200">{p.member_name}</td>
                    <td className="py-3 px-2 text-slate-400">{p.championship_name}</td>
                    <td className="py-3 px-2 text-slate-350">{p.category} ({p.weight} kg)</td>
                    <td className="py-3 px-2 text-slate-400">{p.match_number || '-'}</td>
                    <td className="py-3 px-2 text-slate-400">{p.target_medal}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.medal === 'emas' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        p.medal === 'perak' ? 'bg-slate-300/10 text-slate-300' :
                        p.medal === 'perunggu' ? 'bg-amber-600/10 text-amber-500' :
                        'bg-slate-850 text-slate-500'
                      }`}>
                        🏆 {p.medal || 'belum tanding'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => startEditParticipant(p)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleParticipantDelete(p.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Buat Kejuaraan Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingChampionship(null); 
          setChampForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], organizer: '', level: 'internal', description: '' }); 
        }} 
        title={editingChampionship ? "Edit Event Championship" : "Buat Event Championship Baru"}
      >
        <form onSubmit={handleChampSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Nama Turnamen / Kejuaraan *</label>
            <input
              type="text"
              placeholder="Contoh: Piala Walikota Depok V 2026"
              value={champForm.name}
              onChange={(e) => setChampForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Lokasi Penyelenggaraan *</label>
              <input
                type="text"
                placeholder="Contoh: GOR Kartika, Depok"
                value={champForm.location}
                onChange={(e) => setChampForm(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                value={champForm.date}
                onChange={(e) => setChampForm(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Penyelenggara / Organizer *</label>
              <input
                type="text"
                placeholder="Contoh: Pengcab TI Depok"
                value={champForm.organizer}
                onChange={(e) => setChampForm(prev => ({ ...prev, organizer: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tingkat / Level Kejuaraan *</label>
              <select
                value={champForm.level}
                onChange={(e) => setChampForm(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="internal">Internal Dojang</option>
                <option value="regional">Regional / Kota</option>
                <option value="provinsi">Provinsi</option>
                <option value="nasional">Nasional</option>
                <option value="internasional">Internasional</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Deskripsi Ringkas</label>
            <textarea
              rows="3"
              value={champForm.description}
              onChange={(e) => setChampForm(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { 
                setIsModalOpen(false); 
                setEditingChampionship(null); 
                setChampForm({ name: '', location: '', date: new Date().toISOString().split('T')[0], organizer: '', level: 'internal', description: '' }); 
              }}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
            >
              {editingChampionship ? 'Simpan Perubahan' : 'Buat Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Daftar Peserta Modal */}
      <Modal 
        isOpen={isRegOpen} 
        onClose={() => { 
          setIsRegOpen(false); 
          setEditingParticipant(null); 
          setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' }); 
          setWeightWarning('');
        }} 
        title={editingParticipant ? "Edit Data Peserta Turnamen" : "Daftarkan Atlet ke Turnamen"}
      >
        <form onSubmit={handleParticipantSubmit} className="space-y-5 text-xs text-slate-355">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Event Kejuaraan */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Pilih Turnamen *</label>
              <select
                value={partForm.championship_id}
                onChange={(e) => setPartForm(prev => ({ ...prev, championship_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                required
              >
                <option value="">Pilih Event</option>
                {championships.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Pilih Atlet */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Pilih Atlet *</label>
              <select
                value={partForm.member_id}
                onChange={(e) => setPartForm(prev => ({ ...prev, member_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                required
              >
                <option value="">Pilih Atlet</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.weight} kg)</option>
                ))}
              </select>
            </div>

            {/* Kategori Tanding */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kategori Tanding *</label>
              <input
                type="text"
                placeholder="Contoh: Under 25kg atau Kyorugi Cadet"
                value={partForm.category}
                onChange={(e) => setPartForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>

            {/* Sabuk */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tingkat Sabuk Saat Tanding</label>
              <select
                value={partForm.belt_id}
                onChange={(e) => setPartForm(prev => ({ ...prev, belt_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="">Pilih Sabuk</option>
                {belts.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Target Medali */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Target Pencapaian *</label>
              <select
                value={partForm.target_medal}
                onChange={(e) => setPartForm(prev => ({ ...prev, target_medal: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
              >
                <option value="Emas">Emas</option>
                <option value="Perak">Perak</option>
                <option value="Perunggu">Perunggu</option>
                <option value="Partisipasi">Partisipasi</option>
              </select>
            </div>

            {/* Nomor Pertandingan */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nomor Tanding / Pool</label>
              <input
                type="text"
                placeholder="Contoh: Pool A - 04"
                value={partForm.match_number}
                onChange={(e) => setPartForm(prev => ({ ...prev, match_number: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>

            {/* Hasil Medali (Only when editing) */}
            {editingParticipant && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Hasil Medali Turnamen</label>
                <select
                  value={partForm.medal || ''}
                  onChange={(e) => setPartForm(prev => ({ ...prev, medal: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                >
                  <option value="">Belum Selesai / Tanpa Medali</option>
                  <option value="emas">Emas</option>
                  <option value="perak">Perak</option>
                  <option value="perunggu">Perunggu</option>
                </select>
              </div>
            )}
          </div>

          {/* Dynamic Weight Limit boundary alert indicator */}
          {weightWarning && (
            <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 flex items-center gap-2 font-medium">
              <BadgeAlert size={16} />
              <span>{weightWarning}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { 
                setIsRegOpen(false); 
                setEditingParticipant(null); 
                setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' }); 
                setWeightWarning('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg"
            >
              {editingParticipant ? 'Simpan Perubahan' : 'Daftarkan Atlet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
