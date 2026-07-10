import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { 
  Plus, Check, Clock, Calendar, BadgeCent, FileText, Printer, User, Phone, MapPin,
  Edit, Trash2, FileSpreadsheet
} from 'lucide-react';

export default function Coaches() {
  const [coaches, setCoaches] = useState([]);
  const [honorReports, setHonorReports] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  
  const [editingCoach, setEditingCoach] = useState(null);
  const [editingAttendance, setEditingAttendance] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    base_honor: '',
    status: 'aktif'
  });

  const [attData, setAttData] = useState({
    coach_id: '',
    date: new Date().toISOString().split('T')[0],
    status: 'hadir',
    time_in: '16:00',
    time_out: '18:00'
  });

  const [bulkAttDate, setBulkAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkStatusMap, setBulkStatusMap] = useState({});

  const [isLoading, setIsLoading] = useState(false);

  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  const filteredHonorReports = honorReports.filter(r => {
    const reportDate = new Date(r.date);
    const m = reportDate.getMonth() + 1;
    const y = reportDate.getFullYear();
    const matchesMonth = filterMonth === '' ? true : m === parseInt(filterMonth);
    const matchesYear = y === parseInt(filterYear);
    return matchesMonth && matchesYear;
  });

  const downloadHonorExcel = () => {
    const headers = ['No', 'Nama Pelatih', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status', 'Honorarium'];
    const rows = filteredHonorReports.map((r, index) => [
      index + 1,
      r.coach_name,
      new Date(r.date).toLocaleDateString('id-ID'),
      r.time_in || '-',
      r.time_out || '-',
      r.status.toUpperCase(),
      `Rp ${parseFloat(r.honor_calculated).toLocaleString()}`
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Honorarium_Pelatih_${filterMonth ? `Bulan_${filterMonth}` : 'Semua_Bulan'}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadHonorPdf = () => {
    const printWindow = window.open('', '_blank');
    const getMonthName = (mNum) => {
      const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return names[mNum - 1] || '';
    };

    const titleStr = `Laporan Honorarium Pelatih - ${filterMonth ? getMonthName(parseInt(filterMonth)) : 'Semua Bulan'} ${filterYear}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>\${titleStr}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 20px; line-height: 1.5; }
            h2 { margin-bottom: 5px; color: #0f172a; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 10px 8px; text-align: left; font-weight: 600; text-transform: uppercase; color: #475569; }
            td { border-bottom: 1px solid #f1f5f9; padding: 10px 8px; color: #334155; }
            .text-center { text-align: center; }
            .text-right { text-align: right; font-weight: bold; }
            .status { font-weight: bold; text-transform: uppercase; }
            .status-hadir { color: #16a34a; }
            .status-izin { color: #2563eb; }
            .status-sakit { color: #d97706; }
            .status-alpha { color: #dc2626; }
          </style>
        </head>
        <body>
          <h2>\${titleStr}</h2>
          <p>Dicetak pada: \${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Pelatih</th>
                <th>Tanggal</th>
                <th>Jam Masuk / Pulang</th>
                <th>Status</th>
                <th class="text-right">Honorarium</th>
              </tr>
            </thead>
            <tbody>
              \${filteredHonorReports.map((r, idx) => \`
                <tr>
                  <td class="text-center">\${idx + 1}</td>
                  <td style="font-weight: 500;">\${r.coach_name}</td>
                  <td>\${new Date(r.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td>\${r.time_in || '-'} - \${r.time_out || '-'}</td>
                  <td class="status status-\${r.status}">\${r.status}</td>
                  <td class="text-right">Rp \${parseFloat(r.honor_calculated).toLocaleString()}</td>
                </tr>
              \`).join('')}
              <tr>
                <td colspan="5" class="text-right" style="padding-top: 15px; border-bottom: none;">TOTAL ACCUMULATED HONOR:</td>
                <td class="text-right" style="padding-top: 15px; border-bottom: none; font-size: 13px; color: #1e293b;">
                  Rp \${filteredHonorReports.reduce((sum, r) => sum + parseFloat(r.honor_calculated), 0).toLocaleString()}
                </td>
              </tr>
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
  };

  const fetchCoaches = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.COACHES.LIST);
      if (res.success) setCoaches(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHonorReports = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.REPORTS.HONOR);
      if (res.success) setHonorReports(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCoaches();
    fetchHonorReports();
  }, []);

  const initBulkAttendance = () => {
    setBulkAttDate(new Date().toISOString().split('T')[0]);
    const initialMap = {};
    coaches.forEach(c => {
      initialMap[c.id] = {
        coach_id: c.id,
        status: 'hadir',
        time_in: '16:00',
        time_out: '18:00'
      };
    });
    setBulkStatusMap(initialMap);
  };

  useEffect(() => {
    if (coaches.length > 0) {
      const initialMap = {};
      coaches.forEach(c => {
        initialMap[c.id] = {
          coach_id: c.id,
          status: 'hadir',
          time_in: '16:00',
          time_out: '18:00'
        };
      });
      setBulkStatusMap(prev => {
        const updated = { ...prev };
        coaches.forEach(c => {
          if (!updated[c.id]) {
            updated[c.id] = {
              coach_id: c.id,
              status: 'hadir',
              time_in: '16:00',
              time_out: '18:00'
            };
          }
        });
        return updated;
      });
    }
  }, [coaches]);

  const startEditCoach = (c) => {
    setEditingCoach(c);
    setFormData({
      name: c.name,
      whatsapp: c.whatsapp || '',
      address: c.address || '',
      base_honor: c.base_honor,
      status: c.status || 'aktif'
    });
    setIsModalOpen(true);
  };

  const handleCoachDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pelatih ini? Semua riwayat kehadiran pelatih ini juga akan dihapus.')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.COACHES.DETAIL(id));
      if (res.success) {
        toast.success('Pelatih berhasil dihapus!');
        fetchCoaches();
        fetchHonorReports();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus pelatih');
    }
  };

  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.base_honor) return toast.error('Harap isi nama dan honor dasar!');

    const payload = new FormData();
    Object.keys(formData).forEach(k => payload.append(k, formData[k]));

    setIsLoading(true);
    try {
      let res;
      if (editingCoach) {
        res = await request.put(API_ENDPOINTS.COACHES.DETAIL(editingCoach.id), payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await request.post(API_ENDPOINTS.COACHES.LIST, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      if (res.success) {
        toast.success(editingCoach ? 'Pelatih berhasil diperbarui!' : 'Pelatih berhasil ditambahkan!');
        setIsModalOpen(false);
        setEditingCoach(null);
        setFormData({ name: '', whatsapp: '', address: '', base_honor: '', status: 'aktif' });
        fetchCoaches();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditAttendance = (r) => {
    setEditingAttendance(r);
    setAttData({
      coach_id: r.coach_id,
      date: new Date(r.date).toISOString().split('T')[0],
      status: r.status || 'hadir',
      time_in: r.time_in || '16:00',
      time_out: r.time_out || '18:00'
    });
    setIsAttendanceOpen(true);
  };

  const handleAttendanceDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan presensi pelatih ini?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.REPORTS.HONOR_DETAIL(id));
      if (res.success) {
        toast.success('Catatan presensi berhasil dihapus!');
        fetchHonorReports();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus catatan presensi');
    }
  };

  const handleAttSubmit = async (e) => {
    e.preventDefault();
    if (editingAttendance && (!attData.coach_id || !attData.date)) {
      return toast.error('Harap pilih pelatih dan tanggal!');
    }
    if (!editingAttendance && !bulkAttDate) {
      return toast.error('Harap isi tanggal presensi!');
    }

    setIsLoading(true);
    try {
      let res;
      if (editingAttendance) {
        res = await request.put(API_ENDPOINTS.REPORTS.HONOR_DETAIL(editingAttendance.id), attData);
      } else {
        const attendances = Object.values(bulkStatusMap);
        res = await request.post(API_ENDPOINTS.ATTENDANCE.COACHES_SUBMIT, {
          date: bulkAttDate,
          attendances
        });
      }
      if (res.success) {
        toast.success(editingAttendance ? 'Presensi berhasil diperbarui!' : 'Presensi pelatih berhasil disimpan!');
        setIsAttendanceOpen(false);
        setEditingAttendance(null);
        setAttData({
          coach_id: '',
          date: new Date().toISOString().split('T')[0],
          status: 'hadir',
          time_in: '16:00',
          time_out: '18:00'
        });
        fetchHonorReports();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Manajemen Pelatih & Honor</h2>
          <p className="text-xs text-slate-400">Kelola tarif pelatih dan absensi honorarium otomatis</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              initBulkAttendance();
              setIsAttendanceOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Clock size={14} /> Absen Latihan
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Tambah Pelatih
          </button>
        </div>
      </div>

      {/* Grid of Coaches cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {coaches.map(c => (
          <div key={c.id} className="glass-panel p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-850 border border-slate-800 flex-shrink-0 flex items-center justify-center text-blue-400">
              <User size={24} />
            </div>
            
            <div className="flex-1 space-y-2 text-xs">
              <div>
                <h3 className="font-bold text-slate-100 text-sm leading-snug">{c.name}</h3>
                <span className="text-[10px] text-slate-400">WhatsApp: {c.whatsapp || '-'}</span>
              </div>
              
              <div className="flex items-center gap-1 text-[11px] text-slate-350">
                <BadgeCent size={13} className="text-slate-500" />
                <span>Honor dasar: <strong>Rp {parseFloat(c.base_honor).toLocaleString()}</strong> / sesi</span>
              </div>

              <div className="pt-1.5 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                  c.status === 'aktif' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-700/30 text-slate-400'
                }`}>{c.status}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => startEditCoach(c)}
                    className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleCoachDelete(c.id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance Honor records list */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800/80">
          <div>
            <h3 className="font-semibold text-sm text-slate-200">Riwayat Presensi & Honorarium</h3>
            <p className="text-[11px] text-slate-450">Laporan akumulasi kehadiran pelatih</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Filter */}
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none"
            >
              <option value="">Semua Bulan</option>
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>

            {/* Year Filter */}
            <input
              type="number"
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())}
              className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 focus:outline-none"
              placeholder="Tahun"
            />

            {/* Download Buttons */}
            <button
              onClick={downloadHonorExcel}
              className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              title="Download Excel"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={downloadHonorPdf}
              className="px-3 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
              title="Download PDF"
            >
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>

        {/* Ringkasan Kalkulasi Honor Bulanan */}
        <div className="bg-slate-950/25 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <h4 className="font-bold text-xs text-slate-250 flex items-center gap-1.5 uppercase tracking-wider">
            <BadgeCent size={14} className="text-blue-400" /> Ringkasan Honor & Kehadiran Pelatih (Filter Aktif)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Nama Pelatih</th>
                  <th className="py-2.5 px-3">Tarif Honor Dasar</th>
                  <th className="py-2.5 px-3 text-center">Total Kehadiran (Hadir)</th>
                  <th className="py-2.5 px-3 text-right">Total Akumulasi Honor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {coaches.map(c => {
                  const coachReports = filteredHonorReports.filter(r => r.coach_id === c.id);
                  const totalHadir = coachReports.filter(r => r.status === 'hadir').length;
                  const totalHonor = coachReports.reduce((sum, r) => sum + parseFloat(r.honor_calculated || 0), 0);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/10 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{c.name}</td>
                      <td className="py-2.5 px-3 text-slate-450">Rp {parseFloat(c.base_honor).toLocaleString()} / sesi</td>
                      <td className="py-2.5 px-3 text-center text-slate-300 font-bold">{totalHadir} Sesi</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-450 font-mono">Rp {totalHonor.toLocaleString()}</td>
                    </tr>
                  );
                })}
                {coaches.length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 text-center text-slate-500 font-medium">Tidak ada pelatih terdaftar</td>
                  </tr>
                )}
                {coaches.length > 0 && (
                  <tr className="font-bold border-t border-slate-800 bg-slate-900/40">
                    <td colSpan="2" className="py-2.5 px-3 text-slate-300 uppercase text-[10px] tracking-wider">Total Akumulasi Seluruh Pelatih</td>
                    <td className="py-2.5 px-3 text-center text-slate-200 font-black">
                      {coaches.reduce((sum, c) => sum + filteredHonorReports.filter(r => r.coach_id === c.id && r.status === 'hadir').length, 0)} Sesi
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-300 font-black font-mono">
                      Rp {coaches.reduce((sum, c) => {
                        const coachReports = filteredHonorReports.filter(r => r.coach_id === c.id);
                        return sum + coachReports.reduce((s, r) => s + parseFloat(r.honor_calculated || 0), 0);
                      }, 0).toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredHonorReports.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat kehadiran tercatat.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-2">Pelatih</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">Jam Masuk / Pulang</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Honor Diperoleh</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredHonorReports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-2 font-medium text-slate-200">{r.coach_name}</td>
                    <td className="py-3 px-2 text-slate-400">{new Date(r.date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-2 text-slate-400">{r.time_in || '-'} - {r.time_out || '-'}</td>
                    <td className="py-3 px-2 uppercase font-semibold text-[10px] text-green-400">{r.status}</td>
                    <td className="py-3 px-2 font-bold text-slate-100">Rp {parseFloat(r.honor_calculated).toLocaleString()}</td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => startEditAttendance(r)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleAttendanceDelete(r.id)}
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

      {/* Add Coach Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingCoach(null); 
          setFormData({ name: '', whatsapp: '', address: '', base_honor: '', status: 'aktif' }); 
        }} 
        title={editingCoach ? "Edit Pelatih" : "Tambah Pelatih Baru"}
      >
        <form onSubmit={handleCoachSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Nama Lengkap *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nomor WhatsApp</label>
              <input
                type="text"
                placeholder="0812xxxxxxxx"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tarif Honor Dasar (Rp) *</label>
              <input
                type="number"
                placeholder="Honor per kehadiran"
                value={formData.base_honor}
                onChange={(e) => setFormData(prev => ({ ...prev, base_honor: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Alamat Lengkap</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
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
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <Modal 
        isOpen={isAttendanceOpen} 
        onClose={() => { 
          setIsAttendanceOpen(false); 
          setEditingAttendance(null); 
          setAttData({ coach_id: '', date: new Date().toISOString().split('T')[0], status: 'hadir', time_in: '16:00', time_out: '18:00' }); 
        }} 
        title={editingAttendance ? "Edit Presensi Pelatih" : "Catat Absensi Pelatih"}
      >
        <form onSubmit={handleAttSubmit} className="space-y-5 text-xs text-slate-300">
          {editingAttendance ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Pilih Pelatih *</label>
                <select
                  value={attData.coach_id}
                  onChange={(e) => setAttData(prev => ({ ...prev, coach_id: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  required
                  disabled
                >
                  <option value="">Pilih Pelatih</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tanggal *</label>
                  <input
                    type="date"
                    value={attData.date}
                    onChange={(e) => setAttData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Status Absen *</label>
                  <select
                    value={attData.status}
                    onChange={(e) => setAttData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  >
                    <option value="hadir">Hadir (Dapat Honor)</option>
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                    <option value="alpha">Alpha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jam Masuk</label>
                  <input
                    type="time"
                    value={attData.time_in}
                    onChange={(e) => setAttData(prev => ({ ...prev, time_in: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Jam Keluar</label>
                  <input
                    type="time"
                    value={attData.time_out}
                    onChange={(e) => setAttData(prev => ({ ...prev, time_out: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 text-xs">Tanggal Latihan *</label>
                <input
                  type="date"
                  value={bulkAttDate}
                  onChange={(e) => setBulkAttDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
                  required
                />
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-3">
                <h4 className="font-bold text-slate-850 text-xs">Daftar Pelatih ({coaches.length})</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {coaches.map(c => {
                    const mapEntry = bulkStatusMap[c.id] || { status: 'hadir', time_in: '16:00', time_out: '18:00' };
                    return (
                      <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-all hover:border-slate-300">
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">{c.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">Tarif: Rp {parseFloat(c.base_honor).toLocaleString()} / sesi</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {/* Status buttons */}
                          <div className="flex items-center gap-1">
                            {['hadir', 'izin', 'sakit', 'alpha'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  setBulkStatusMap(prev => ({
                                    ...prev,
                                    [c.id]: { ...prev[c.id], status }
                                  }));
                                }}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                  mapEntry.status === status
                                    ? status === 'hadir' ? 'bg-green-600 text-white shadow-sm' :
                                      status === 'izin' ? 'bg-blue-600 text-white shadow-sm' :
                                      status === 'sakit' ? 'bg-yellow-500 text-slate-950 shadow-sm' : 'bg-red-600 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>

                          {/* Time fields (only for 'hadir') */}
                          {mapEntry.status === 'hadir' && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <input
                                type="time"
                                value={mapEntry.time_in || '16:00'}
                                onChange={(e) => {
                                  setBulkStatusMap(prev => ({
                                    ...prev,
                                    [c.id]: { ...prev[c.id], time_in: e.target.value }
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-center focus:border-blue-500 font-semibold"
                              />
                              <span className="text-slate-400">s/d</span>
                              <input
                                type="time"
                                value={mapEntry.time_out || '18:00'}
                                onChange={(e) => {
                                  setBulkStatusMap(prev => ({
                                    ...prev,
                                    [c.id]: { ...prev[c.id], time_out: e.target.value }
                                  }));
                                }}
                                className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-800 text-center focus:border-blue-500 font-semibold"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => { 
                setIsAttendanceOpen(false); 
                setEditingAttendance(null); 
                setAttData({ coach_id: '', date: new Date().toISOString().split('T')[0], status: 'hadir', time_in: '16:00', time_out: '18:00' }); 
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg hover:bg-blue-500 transition-colors text-xs"
            >
              {editingAttendance ? 'Simpan Perubahan' : 'Simpan Presensi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
