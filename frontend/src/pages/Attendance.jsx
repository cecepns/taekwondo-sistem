import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { Calendar, Users, ClipboardCheck, Clock, FileSpreadsheet, FileText } from 'lucide-react';

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Selections
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedCoach, setSelectedCoach] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Status inputs { member_id: status }
  const [statusMap, setStatusMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Search Queries
  const [dailySearchQuery, setDailySearchQuery] = useState('');
  const [monthlySearchQuery, setMonthlySearchQuery] = useState('');

  // Daily Pagination
  const [dailyPage, setDailyPage] = useState(1);

  useEffect(() => {
    setDailyPage(1);
  }, [dailySearchQuery]);

  // Monthly Report tab states
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' or 'monthly'
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const clsRes = await request.get(API_ENDPOINTS.CLASSES.LIST);
        const coachRes = await request.get(API_ENDPOINTS.COACHES.LIST);
        const memberRes = await request.get(`${API_ENDPOINTS.MEMBERS.LIST}?limit=1000`);
        const attRes = await request.get(API_ENDPOINTS.ATTENDANCE.MEMBER_LIST);

        if (clsRes.success) setClasses(clsRes.data);
        if (coachRes.success) setCoaches(coachRes.data);
        if (memberRes.success) {
          setMembers(memberRes.data);
          // Initialize status map to 'hadir'
          const initialMap = {};
          memberRes.data.forEach(m => {
            initialMap[m.id] = 'hadir';
          });
          setStatusMap(initialMap);
        }
        if (attRes.success) setAttendanceHistory(attRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const fetchMonthlyReport = async (month, year) => {
    setIsReportLoading(true);
    try {
      const res = await request.get(`${API_ENDPOINTS.ATTENDANCE.MEMBER_LIST}?month=${month}&year=${year}`);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil laporan bulanan');
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport(reportMonth, reportYear);
    }
  }, [activeTab, reportMonth, reportYear]);

  const handleStatusChange = (memberId, status) => {
    setStatusMap(prev => ({ ...prev, [memberId]: status }));
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedCoach) {
      return toast.error('Harap pilih kelas dan pelatih!');
    }

    const attendances = Object.keys(statusMap).map(mId => ({
      member_id: parseInt(mId),
      status: statusMap[mId]
    }));

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.ATTENDANCE.MEMBER_SUBMIT, {
        date,
        class_id: selectedClass,
        coach_id: selectedCoach,
        attendances
      });
      if (res.success) {
        toast.success('Kehadiran anggota berhasil disimpan!');
        
        // Reload history
        const attRes = await request.get(API_ENDPOINTS.ATTENDANCE.MEMBER_LIST);
        if (attRes.success) setAttendanceHistory(attRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDailyMembers = members.filter(m => 
    m.name.toLowerCase().includes(dailySearchQuery.toLowerCase())
  );

  const dailyPerPage = 20;
  const totalDailyPages = Math.ceil(filteredDailyMembers.length / dailyPerPage);
  const startIndex = (dailyPage - 1) * dailyPerPage;
  const endIndex = startIndex + dailyPerPage;
  const paginatedDailyMembers = filteredDailyMembers.slice(startIndex, endIndex);

  const aggregatedData = members.map(m => {
    const mAttendances = reportData.filter(a => a.member_id === m.id);
    const hadir = mAttendances.filter(a => a.status === 'hadir').length;
    const izin = mAttendances.filter(a => a.status === 'izin').length;
    const sakit = mAttendances.filter(a => a.status === 'sakit').length;
    const alpha = mAttendances.filter(a => a.status === 'alpha').length;
    const total = mAttendances.length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

    return {
      id: m.id,
      name: m.name,
      hadir,
      izin,
      sakit,
      alpha,
      total,
      percentage
    };
  });

  const filteredMonthlyData = aggregatedData.filter(row =>
    row.name.toLowerCase().includes(monthlySearchQuery.toLowerCase())
  );

  const downloadExcel = () => {
    const headers = ['No', 'Nama Anggota', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Total Sesi', 'Persentase Kehadiran'];
    const rows = aggregatedData.map((row, index) => [
      index + 1,
      row.name,
      row.hadir,
      row.izin,
      row.sakit,
      row.alpha,
      row.total,
      `${row.percentage}%`
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    link.setAttribute("download", `Laporan_Absensi_${months[reportMonth - 1]}_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Laporan absensi berhasil diexport ke CSV/Excel!');
  };

  const downloadPDF = () => {
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Absensi Bulanan - ${months[reportMonth - 1]} ${reportYear}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; color: #0f172a; }
            p { text-align: center; margin-top: 0; font-size: 14px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .text-center { text-align: center; }
          </style>
        </head>
        <body>
          <h2>Laporan Presensi Anggota</h2>
          <p>Bulan: ${months[reportMonth - 1]} | Tahun: ${reportYear}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Anggota</th>
                <th class="text-center">Hadir</th>
                <th class="text-center">Izin</th>
                <th class="text-center">Sakit</th>
                <th class="text-center">Alpha</th>
                <th class="text-center">Total Sesi</th>
                <th class="text-center">Kehadiran (%)</th>
              </tr>
            </thead>
            <tbody>
              ${aggregatedData.map((row, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td style="font-weight: 500;">${row.name}</td>
                  <td class="text-center">${row.hadir}</td>
                  <td class="text-center">${row.izin}</td>
                  <td class="text-center">${row.sakit}</td>
                  <td class="text-center">${row.alpha}</td>
                  <td class="text-center" style="font-weight: 600;">${row.total}</td>
                  <td class="text-center" style="font-weight: bold;">${row.percentage}%</td>
                </tr>
              `).join('')}
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

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 mb-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardCheck size={16} />
          Presensi Latihan
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`py-2.5 px-4 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'monthly'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={16} />
          Laporan Presensi Bulanan
        </button>
      </div>

      {activeTab === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Form inputs */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-slate-850 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ClipboardCheck size={20} className="text-blue-500" /> Presensi Anggota Baru
              </h2>
              
              <form onSubmit={handleAttendanceSubmit} className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Tanggal Latihan *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                      required
                    />
                  </div>

                  {/* Class */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Pilih Kelas *</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                      required
                    >
                      <option value="">Pilih Kelas</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Coach */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-400">Pelatih Pengajar *</label>
                    <select
                      value={selectedCoach}
                      onChange={(e) => setSelectedCoach(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                      required
                    >
                      <option value="">Pilih Pelatih</option>
                      {coaches.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* List of members to check attendance */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-800 text-xs">Daftar Anggota ({filteredDailyMembers.length})</h4>
                    <input
                      type="text"
                      placeholder="Cari nama anggota..."
                      value={dailySearchQuery}
                      onChange={(e) => setDailySearchQuery(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-full sm:w-48 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {paginatedDailyMembers.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center font-medium">Anggota tidak ditemukan.</p>
                    ) : (
                      paginatedDailyMembers.map(m => (
                        <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                          <div className="font-semibold text-slate-700">{m.name}</div>
                          
                          <div className="flex items-center gap-1.5">
                            {['hadir', 'izin', 'sakit', 'alpha'].map(status => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleStatusChange(m.id, status)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                                  statusMap[m.id] === status
                                    ? status === 'hadir' ? 'bg-green-600 text-white' :
                                      status === 'izin' ? 'bg-blue-600 text-white' :
                                      status === 'sakit' ? 'bg-yellow-600 text-slate-950' : 'bg-red-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {filteredDailyMembers.length > dailyPerPage && (
                    <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                      <span>
                        Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredDailyMembers.length)} dari {filteredDailyMembers.length} anggota
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={dailyPage === 1}
                          onClick={() => setDailyPage(prev => Math.max(1, prev - 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={dailyPage === totalDailyPages}
                          onClick={() => setDailyPage(prev => Math.min(totalDailyPages, prev + 1))}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500 shadow-lg shadow-blue-600/10"
                  >
                    {isLoading ? 'Menyimpan...' : 'Simpan Kehadiran'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Attendance History log */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
            <h3 className="font-semibold text-sm text-slate-200 pb-2 border-b border-slate-800 flex items-center gap-1.5">
              <Clock size={16} className="text-slate-450" /> Log Kehadiran Terakhir
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {attendanceHistory.map(h => (
                <div key={h.id} className="p-3 bg-slate-950/30 border border-slate-855 rounded-xl text-xs flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-200 block">{h.member_name}</span>
                    <span className="text-[10px] text-slate-500 block">{new Date(h.date).toLocaleDateString('id-ID')}</span>
                    <span className="text-slate-400 block text-[10px]">Kelas: {h.class_name}</span>
                  </div>
                  
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    h.status === 'hadir' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    h.status === 'izin' ? 'bg-blue-500/10 text-blue-400' :
                    h.status === 'sakit' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
                  }`}>{h.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Monthly Report View */
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Laporan Presensi Bulanan</h2>
              <p className="text-xs text-slate-500">Ringkasan kehadiran anggota per bulan</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Cari nama..."
                value={monthlySearchQuery}
                onChange={(e) => setMonthlySearchQuery(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 w-full sm:w-40 font-medium"
              />

              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-medium"
              >
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

              <select
                value={reportYear}
                onChange={(e) => setReportYear(parseInt(e.target.value))}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs focus:outline-none focus:border-blue-500 font-medium"
              >
                {[2025, 2026, 2027, 2028].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={downloadExcel}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>

              <button
                type="button"
                onClick={downloadPDF}
                className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/10"
              >
                <FileText size={14} /> PDF
              </button>
            </div>
          </div>

          {isReportLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Anggota</th>
                    <th className="py-3 px-4 text-center">Hadir</th>
                    <th className="py-3 px-4 text-center">Izin</th>
                    <th className="py-3 px-4 text-center">Sakit</th>
                    <th className="py-3 px-4 text-center">Alpha</th>
                    <th className="py-3 px-4 text-center">Total Sesi</th>
                    <th className="py-3 px-4 text-center">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMonthlyData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-slate-500">
                        Tidak ada data presensi pada bulan ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMonthlyData.map((row, index) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-500">{index + 1}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{row.name}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-bold">{row.hadir}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold">{row.izin}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-yellow-50 text-yellow-700 font-bold">{row.sakit}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold">{row.alpha}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">{row.total}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                              <div 
                                className={`h-full rounded-full ${
                                  row.percentage >= 80 ? 'bg-green-500' :
                                  row.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${row.percentage}%` }}
                              />
                            </div>
                            <span className={`font-bold ${
                              row.percentage >= 80 ? 'text-green-600' :
                              row.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>{row.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
