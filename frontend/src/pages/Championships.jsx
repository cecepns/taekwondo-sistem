import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { 
  Plus, Award, MapPin, Calendar, Users, ShieldAlert, BadgeAlert,
  Edit, Trash2, Scale, FileSpreadsheet, FileText
} from 'lucide-react';

export default function Championships() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'classes'
  
  const [championships, setChampionships] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [members, setMembers] = useState([]);
  const [belts, setBelts] = useState([]);
  const [classes, setClasses] = useState([]); // Master weight classes

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRegOpen, setIsRegOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingChampionship, setEditingChampionship] = useState(null);
  const [editingParticipant, setEditingParticipant] = useState(null);

  // Master Class Modal States
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({
    category: 'Kyorugi',
    age_group: 'Pracadet A',
    gender: 'Semua',
    class_name: '',
    min_weight: '',
    max_weight: ''
  });

  // Weigh-in Modal States
  const [isWeighInOpen, setIsWeighInOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [weighInWeight, setWeighInWeight] = useState('');

  // Participant Form state
  const [partForm, setPartForm] = useState({
    championship_id: '',
    member_id: '',
    match_number: '',
    category: '',
    class_id: '',
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
      const classesRes = await request.get(API_ENDPOINTS.CHAMPIONSHIPS.CLASSES_LIST);

      if (chRes.success) setChampionships(chRes.data);
      if (partRes.success) setParticipants(partRes.data);
      if (membersRes.success) setMembers(membersRes.data);
      if (beltsRes.success) setBelts(beltsRes.data);
      if (classesRes.success) setClasses(classesRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Check Weight Limit automatically when member_id or class_id changes
  useEffect(() => {
    async function checkWeightLimit() {
      if (!partForm.member_id || !partForm.class_id) {
        setWeightWarning('');
        return;
      }
      try {
        const res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.VALIDATE_WEIGHT, {
          member_id: partForm.member_id,
          class_id: partForm.class_id
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
  }, [partForm.member_id, partForm.class_id]);

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
      class_id: p.class_id || '',
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
    if (!partForm.championship_id || !partForm.member_id || !partForm.class_id) {
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
        setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', class_id: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' });
        setWeightWarning('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Master Class actions
  const startEditClass = (c) => {
    setEditingClass(c);
    setClassForm({
      category: c.category,
      age_group: c.age_group,
      gender: c.gender,
      class_name: c.class_name,
      min_weight: c.min_weight,
      max_weight: c.max_weight
    });
    setIsClassModalOpen(true);
  };

  const handleClassDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kelas tanding ini?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.CHAMPIONSHIPS.CLASSES_DETAIL(id));
      if (res.success) {
        toast.success('Kelas tanding berhasil dihapus!');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus kelas tanding');
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (!classForm.class_name) return toast.error('Harap lengkapi nama kelas (contoh: Under 22kg)!');

    setIsLoading(true);
    try {
      let res;
      if (editingClass) {
        res = await request.put(API_ENDPOINTS.CHAMPIONSHIPS.CLASSES_DETAIL(editingClass.id), classForm);
      } else {
        res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.CLASSES_LIST, classForm);
      }
      if (res.success) {
        toast.success(editingClass ? 'Kelas tanding diperbarui!' : 'Kelas tanding ditambahkan!');
        setIsClassModalOpen(false);
        setEditingClass(null);
        setClassForm({ category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: '', min_weight: '', max_weight: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Weigh-in submit
  const handleWeighInSubmit = async (e) => {
    e.preventDefault();
    if (!weighInWeight) return toast.error('Harap isi berat badan timbang!');

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.CHAMPIONSHIPS.WEIGH_IN(selectedParticipant.id), {
        weigh_in_weight: weighInWeight
      });
      if (res.success) {
        toast.success('Data timbang berat badan berhasil disimpan!');
        setIsWeighInOpen(false);
        setSelectedParticipant(null);
        setWeighInWeight('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadChampParticipantsExcel = () => {
    try {
      const headers = ['No', 'Nama Atlet', 'Berat Daftar', 'Kejuaraan', 'Kategori', 'Batas Kelas', 'Berat Timbang', 'Status Kelayakan', 'No Tanding', 'Medali'];
      const rows = participants.map((p, index) => {
        const classLimits = p.class_class_name ? `${parseFloat(p.class_min_weight)} - ${parseFloat(p.class_max_weight)} kg` : '-';
        const weighInStatusStr = p.weigh_in_status === 'passed' ? 'Lolos' :
                                p.weigh_in_status === 'overweight' ? 'Overweight' :
                                p.weigh_in_status === 'underweight' ? 'Underweight' : 'Belum Timbang';
        return [
          index + 1,
          p.member_name,
          `${p.weight} kg`,
          p.championship_name,
          p.class_class_name ? `${p.class_category} ${p.class_age_group} (${p.class_class_name})` : p.category,
          classLimits,
          p.weigh_in_weight ? `${parseFloat(p.weigh_in_weight)} kg` : '-',
          weighInStatusStr,
          p.match_number || '-',
          p.medal || 'belum tanding'
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Laporan_Timbang_Atlet_Kejuaraan.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mendownload Excel timbang atlet');
    }
  };

  const downloadChampParticipantsPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      const titleStr = 'Laporan Kontrol Berat Badan & Timbang Atlet';

      printWindow.document.write(`
        <html>
          <head>
            <title>${titleStr}</title>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 20px; line-height: 1.5; }
              h2 { margin-bottom: 5px; color: #0f172a; }
              p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
              th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 8px; text-align: left; font-weight: 600; text-transform: uppercase; color: #475569; }
              td { border-bottom: 1px solid #f1f5f9; padding: 10px 8px; color: #334155; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .status-lolos { color: #16a34a; font-weight: bold; }
              .status-over { color: #dc2626; font-weight: bold; }
              .status-under { color: #ca8a04; font-weight: bold; }
            </style>
          </head>
          <body>
            <h2>${titleStr}</h2>
            <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;" class="text-center">No</th>
                  <th>Nama Atlet</th>
                  <th>Kejuaraan</th>
                  <th>Kategori / Kelas</th>
                  <th class="text-center">Batas Kelas</th>
                  <th class="text-center">Timbang Aktual</th>
                  <th class="text-center">Status Kelayakan</th>
                  <th>No Tanding</th>
                </tr>
              </thead>
              <tbody>
                ${participants.map((p, idx) => {
                  const classLimits = p.class_class_name ? `${parseFloat(p.class_min_weight)} - ${parseFloat(p.class_max_weight)} kg` : '-';
                  let statusHtml = '<span>Belum Timbang</span>';
                  if (p.weigh_in_status === 'passed') {
                    statusHtml = '<span class="status-lolos">Lolos</span>';
                  } else if (p.weigh_in_status === 'overweight') {
                    statusHtml = '<span class="status-over">Overweight</span>';
                  } else if (p.weigh_in_status === 'underweight') {
                    statusHtml = '<span class="status-under">Underweight</span>';
                  }
                  
                  return `
                    <tr>
                      <td class="text-center">${idx + 1}</td>
                      <td style="font-weight: 500;">${p.member_name} (Daftar: ${p.weight} kg)</td>
                      <td>${p.championship_name}</td>
                      <td>${p.class_class_name ? `${p.class_category} ${p.class_age_group} (${p.class_class_name})` : p.category}</td>
                      <td class="text-center">${classLimits}</td>
                      <td class="text-center" style="font-weight: 600;">${p.weigh_in_weight ? `${parseFloat(p.weigh_in_weight)} kg` : '-'}</td>
                      <td class="text-center">${statusHtml}</td>
                      <td>${p.match_number || '-'}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      toast.error('Gagal mencetak PDF timbang atlet');
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
          {activeTab === 'events' ? (
            <>
              <button 
                onClick={() => setIsRegOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Users size={14} /> Daftar Peserta
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
              >
                <Plus size={16} /> Buat Kejuaraan
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setEditingClass(null);
                setClassForm({ category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: '', min_weight: '', max_weight: '' });
                setIsClassModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Plus size={16} /> Tambah Kelas Tanding
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('events')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'events'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Event & Atlet
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'classes'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Database Kelas Tanding
        </button>
      </div>

      {activeTab === 'events' ? (
        <>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800">
              <h3 className="font-semibold text-sm text-slate-200">Daftar Atlet Turnamen</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadChampParticipantsExcel}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
                  title="Download Excel"
                >
                  <FileSpreadsheet size={13} /> Excel
                </button>
                <button
                  onClick={downloadChampParticipantsPdf}
                  className="px-3 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
                  title="Download PDF"
                >
                  <FileText size={13} /> PDF
                </button>
              </div>
            </div>
            
            {participants.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada atlet terdaftar dalam turnamen.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-2">Atlet</th>
                      <th className="py-3 px-2">Kejuaraan</th>
                      <th className="py-3 px-2">Kategori / Kelas</th>
                      <th className="py-3 px-2 text-center">Batas Kelas</th>
                      <th className="py-3 px-2 text-center">Timbang Aktual</th>
                      <th className="py-3 px-2 text-center">Status Kelayakan</th>
                      <th className="py-3 px-2">No Tanding</th>
                      <th className="py-3 px-2">Medali</th>
                      <th className="py-3 px-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {participants.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/20">
                        <td className="py-3 px-2 font-medium text-slate-200">
                          <div>{p.member_name}</div>
                          <div className="text-[10px] text-slate-500">Daftar: {p.weight} kg</div>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{p.championship_name}</td>
                        <td className="py-3 px-2 text-slate-350">
                          {p.class_class_name ? (
                            <div>
                              <div className="font-medium text-slate-200">{p.class_category} - {p.class_age_group}</div>
                              <div className="text-[10px] text-slate-450">{p.class_class_name} ({p.class_gender === 'Semua' ? 'L/P' : p.class_gender})</div>
                            </div>
                          ) : (
                            <span>{p.category}</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-400">
                          {p.class_class_name ? `${parseFloat(p.class_min_weight)} - ${parseFloat(p.class_max_weight)} kg` : '-'}
                        </td>
                        <td className="py-3 px-2 text-center text-slate-200 font-semibold font-mono">
                          {p.weigh_in_weight ? `${parseFloat(p.weigh_in_weight)} kg` : '-'}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.weigh_in_status === 'passed' ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20' :
                            p.weigh_in_status === 'overweight' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            p.weigh_in_status === 'underweight' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-slate-800 text-slate-450 border border-slate-700'
                          }`}>
                            {p.weigh_in_status === 'passed' ? '✓ Lolos' :
                             p.weigh_in_status === 'overweight' ? '✗ Overweight' :
                             p.weigh_in_status === 'underweight' ? '✗ Underweight' : 'Belum Timbang'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{p.match_number || '-'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.medal === 'emas' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            p.medal === 'perak' ? 'bg-slate-300/10 text-slate-350 border border-slate-400/20' :
                            p.medal === 'perunggu' ? 'bg-amber-600/10 text-amber-500 border border-amber-600/20' :
                            'bg-slate-850 text-slate-500'
                          }`}>
                            🏆 {p.medal || 'belum tanding'}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedParticipant(p);
                                setWeighInWeight(p.weigh_in_weight || '');
                                setIsWeighInOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-400 transition-colors"
                              title="Timbang / Kontrol Berat"
                            >
                              <Scale size={14} />
                            </button>
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
        </>
      ) : (
        /* Database Kelas Tanding Panel */
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-semibold text-sm text-slate-200">Konfigurasi Kategori & Kelas Tanding</h3>
          </div>

          {classes.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Belum ada data kategori dan kelas tanding.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                    <th className="py-3 px-2">Kategori</th>
                    <th className="py-3 px-2">Golongan Usia</th>
                    <th className="py-3 px-2">Jenis Kelamin</th>
                    <th className="py-3 px-2">Nama Kelas (Under)</th>
                    <th className="py-3 px-2 text-center">Batas Berat Minimal</th>
                    <th className="py-3 px-2 text-center">Batas Berat Maksimal</th>
                    <th className="py-3 px-2 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {classes.map(c => (
                    <tr key={c.id} className="hover:bg-slate-800/20">
                      <td className="py-3 px-2 font-medium text-slate-200">{c.category}</td>
                      <td className="py-3 px-2 text-slate-350">{c.age_group}</td>
                      <td className="py-3 px-2 text-slate-400">
                        {c.gender === 'Semua' ? 'Putra & Putri' : c.gender === 'L' ? 'Putra Only' : 'Putri Only'}
                      </td>
                      <td className="py-3 px-2 text-slate-200 font-semibold">{c.class_name}</td>
                      <td className="py-3 px-2 text-center text-slate-400">{parseFloat(c.min_weight)} kg</td>
                      <td className="py-3 px-2 text-center text-slate-400">{parseFloat(c.max_weight)} kg</td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button 
                            onClick={() => startEditClass(c)}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            onClick={() => handleClassDelete(c.id)}
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
      )}

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

      {/* Database Master Class Modal */}
      <Modal
        isOpen={isClassModalOpen}
        onClose={() => {
          setIsClassModalOpen(false);
          setEditingClass(null);
          setClassForm({ category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: '', min_weight: '', max_weight: '' });
        }}
        title={editingClass ? "Edit Kelas Tanding" : "Tambah Kelas Tanding Baru"}
      >
        <form onSubmit={handleClassSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Kategori Turnamen *</label>
              <select
                value={classForm.category}
                onChange={(e) => setClassForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-250"
              >
                <option value="Kyorugi">Kyorugi (Tanding)</option>
                <option value="Poomsae">Poomsae (Jurus)</option>
                <option value="Festival">Festival</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Golongan Usia *</label>
              <select
                value={classForm.age_group}
                onChange={(e) => setClassForm(prev => ({ ...prev, age_group: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-250"
              >
                <option value="Pracadet A">Pracadet A (Usia &lt; 9)</option>
                <option value="Pracadet B">Pracadet B (Usia 9-11)</option>
                <option value="Cadet">Cadet (Usia 12-14)</option>
                <option value="Junior">Junior (Usia 15-17)</option>
                <option value="Senior">Senior (Usia 18+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Jenis Kelamin *</label>
              <select
                value={classForm.gender}
                onChange={(e) => setClassForm(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-250"
              >
                <option value="Semua">Putra & Putri (L/P)</option>
                <option value="L">Hanya Putra (L)</option>
                <option value="P">Hanya Putri (P)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nama Kelas (Under) *</label>
              <input
                type="text"
                placeholder="Contoh: Under 22kg"
                value={classForm.class_name}
                onChange={(e) => setClassForm(prev => ({ ...prev, class_name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Batas Berat Minimal (kg)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Contoh: 20.00"
                value={classForm.min_weight}
                onChange={(e) => setClassForm(prev => ({ ...prev, min_weight: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Batas Berat Maksimal (kg)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Contoh: 22.00"
                value={classForm.max_weight}
                onChange={(e) => setClassForm(prev => ({ ...prev, max_weight: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsClassModalOpen(false);
                setEditingClass(null);
                setClassForm({ category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: '', min_weight: '', max_weight: '' });
              }}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
            >
              {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Kontrol Timbang Berat Badan Modal */}
      <Modal
        isOpen={isWeighInOpen}
        onClose={() => {
          setIsWeighInOpen(false);
          setSelectedParticipant(null);
          setWeighInWeight('');
        }}
        title="Weigh-in / Kontrol Berat Badan Atlet"
      >
        {selectedParticipant && (
          <form onSubmit={handleWeighInSubmit} className="space-y-5 text-xs text-slate-350">
            <div className="p-3.5 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
              <div>Nama Atlet: <strong className="text-slate-100">{selectedParticipant.member_name}</strong></div>
              <div>Kelas Tanding: <strong className="text-slate-100">{selectedParticipant.class_category || 'Kyorugi'} - {selectedParticipant.class_age_group || '-'} ({selectedParticipant.class_class_name || selectedParticipant.category})</strong></div>
              <div>Batas Berat Kelas: <strong className="text-emerald-450">{parseFloat(selectedParticipant.class_min_weight || 0.00)} kg s/d {parseFloat(selectedParticipant.class_max_weight || 999.99)} kg</strong></div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hasil Timbang Aktual (kg) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="Masukkan berat badan hasil timbang"
                value={weighInWeight}
                onChange={(e) => setWeighInWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 font-bold text-sm tracking-wide focus:border-blue-500 focus:outline-none"
                required
                autoFocus
              />
            </div>

            {/* Instant UI weigh-in validation warning message */}
            {(() => {
              if (!weighInWeight) return null;
              const w = parseFloat(weighInWeight);
              const minW = parseFloat(selectedParticipant.class_min_weight || 0.00);
              const maxW = parseFloat(selectedParticipant.class_max_weight || 999.99);

              if (w > maxW) {
                return (
                  <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 flex items-center gap-2 font-medium">
                    <BadgeAlert size={16} />
                    <span>Melebihi batas maksimal kelas. Selisih +{(w - maxW).toFixed(2)} kg (OVERWEIGHT)</span>
                  </div>
                );
              } else if (w < minW) {
                return (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/25 rounded-xl text-yellow-450 flex items-center gap-2 font-medium">
                    <BadgeAlert size={16} />
                    <span>Kurang dari batas minimal kelas. Selisih -{(minW - w).toFixed(2)} kg (UNDERWEIGHT)</span>
                  </div>
                );
              } else {
                return (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 flex items-center gap-2 font-medium">
                    <Award size={16} />
                    <span>Berat badan sesuai dengan kelas tanding (PASSED / LOLOS)</span>
                  </div>
                );
              }
            })()}

            <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsWeighInOpen(false);
                  setSelectedParticipant(null);
                  setWeighInWeight('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Simpan Hasil Timbang
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Daftar Peserta Modal */}
      <Modal 
        isOpen={isRegOpen} 
        onClose={() => { 
          setIsRegOpen(false); 
          setEditingParticipant(null); 
          setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', class_id: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' }); 
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

            {/* Pilih Kelas Tanding */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Pilih Kelas Tanding *</label>
              <select
                value={partForm.class_id || ''}
                onChange={(e) => {
                  const cid = e.target.value;
                  const selectedC = classes.find(cls => cls.id === parseInt(cid));
                  setPartForm(prev => ({ 
                    ...prev, 
                    class_id: cid,
                    category: selectedC ? `${selectedC.category} ${selectedC.age_group} (${selectedC.class_name})` : ''
                  }));
                }}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                required
              >
                <option value="">Pilih Kelas Tanding</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    [{cls.category}] {cls.age_group} - {cls.class_name} ({cls.gender === 'Semua' ? 'L/P' : cls.gender})
                  </option>
                ))}
              </select>
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
              <div className="space-y-1 col-span-2">
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

          {/* Active class details display */}
          {(() => {
            const activeClass = classes.find(c => c.id === parseInt(partForm.class_id));
            if (!activeClass) return null;
            return (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-300 space-y-1.5">
                <span className="font-semibold text-slate-100 text-[11px] block">Detail Batasan Kelas Terpilih:</span>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>Golongan: <strong>{activeClass.age_group}</strong></div>
                  <div>Kategori: <strong>{activeClass.category}</strong></div>
                  <div>Kelamin: <strong>{activeClass.gender === 'Semua' ? 'Putra & Putri' : activeClass.gender === 'L' ? 'Putra Only' : 'Putri Only'}</strong></div>
                  <div>Rentang Berat: <strong className="text-blue-400">{parseFloat(activeClass.min_weight)} kg - {parseFloat(activeClass.max_weight)} kg</strong></div>
                </div>
              </div>
            );
          })()}

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
                setPartForm({ championship_id: '', member_id: '', match_number: '', category: '', class_id: '', belt_id: '', weight: '', target_medal: 'Emas', medal: '' }); 
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
