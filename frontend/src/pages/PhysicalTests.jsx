import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import { 
  Plus, ClipboardCheck, Target, TrendingUp, HelpCircle, ArrowUpRight, ArrowDownRight, Award,
  FileSpreadsheet, FileText, Edit, Trash2, ChevronRight, ChevronDown
} from 'lucide-react';
import Select from 'react-select';

export default function PhysicalTests() {
  const [testTypes, setTestTypes] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [members, setMembers] = useState([]);
  
  // react-select search state with 1s debounce
  const [selectOptions, setSelectOptions] = useState([]);
  const [isSelectLoading, setIsSelectLoading] = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingResult, setEditingResult] = useState(null);

  // Tabs & Grouped Accordion States
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'grouped'
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  // Custom react-select styles matching our theme
  const selectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#ffffff',
      borderColor: state.isFocused ? '#3b82f6' : '#cbd5e1',
      borderRadius: '0.75rem',
      fontSize: '12px',
      color: '#1e293b',
      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
      minHeight: '38px',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f1f5f9' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#1e293b',
      fontSize: '12px',
      cursor: 'pointer'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 50
    })
  };

  const searchMembers = async (query) => {
    setIsSelectLoading(true);
    try {
      const res = await request.get(`${API_ENDPOINTS.MEMBERS.LIST}?limit=100&search=${encodeURIComponent(query)}`);
      if (res.success) {
        setSelectOptions(res.data.map(m => ({
          value: m.id,
          label: `${m.name} (${m.member_number})`
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSelectLoading(false);
    }
  };

  // Debounce API query hook (1 second delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(searchVal);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchVal]);

  // Form Results State
  const [formData, setFormData] = useState({
    member_id: '',
    test_type_id: '',
    date: new Date().toISOString().split('T')[0],
    target_value: '',
    result_value: '',
    notes: ''
  });

  // Form Type State
  const [typeData, setTypeData] = useState({
    name: '',
    category: 'Speed',
    description: ''
  });

  const fetchData = async () => {
    try {
      const typesRes = await request.get(API_ENDPOINTS.PHYSICAL_TESTS.TYPES_LIST);
      const resultsRes = await request.get(API_ENDPOINTS.PHYSICAL_TESTS.RESULTS_LIST);
      const membersRes = await request.get(`${API_ENDPOINTS.MEMBERS.LIST}?limit=1000`);

      if (typesRes.success) setTestTypes(typesRes.data);
      if (resultsRes.success) setTestResults(resultsRes.data);
      if (membersRes.success) setMembers(membersRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadExcel = () => {
    const headers = ['No', 'Nama Atlet', 'Tanggal', 'Jenis Tes', 'Target', 'Hasil', 'Analisa/Evaluasi', 'Perkembangan'];
    const rows = testResults.map((r, index) => [
      index + 1,
      r.member_name,
      new Date(r.date).toLocaleDateString('id-ID'),
      r.test_name,
      r.target_value,
      r.result_value,
      r.evaluation,
      r.status
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Hasil_Tes_Fisik_Atlet.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Hasil tes fisik berhasil diexport ke CSV/Excel!');
  };

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Evaluasi & Riwayat Catatan Tes Fisik Atlet</title>
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
          <h2>Laporan Evaluasi & Catatan Uji Fisik Atlet</h2>
          <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th style="width: 40px;" class="text-center">No</th>
                <th>Nama Atlet</th>
                <th>Tanggal</th>
                <th>Jenis Tes</th>
                <th>Target</th>
                <th>Hasil</th>
                <th>Analisa / Evaluasi</th>
                <th>Perkembangan</th>
              </tr>
            </thead>
            <tbody>
              ${testResults.map((r, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td style="font-weight: 500;">${r.member_name}</td>
                  <td>${new Date(r.date).toLocaleDateString('id-ID')}</td>
                  <td>${r.test_name}</td>
                  <td>${r.target_value}</td>
                  <td>${r.result_value}</td>
                  <td>${r.evaluation}</td>
                  <td style="font-weight: 600; text-transform: uppercase;">${r.status}</td>
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

  useEffect(() => {
    fetchData();
  }, []);

  const startEditResult = (r) => {
    setEditingResult(r);
    setFormData({
      member_id: r.member_id,
      test_type_id: r.test_type_id,
      date: new Date(r.date).toISOString().split('T')[0],
      target_value: r.target_value || '',
      result_value: r.result_value || '',
      notes: r.notes || ''
    });
    // Find member to populate searchVal
    setSearchVal(r.member_name);
    setIsModalOpen(true);
  };

  const handleResultDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan hasil tes fisik ini?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.PHYSICAL_TESTS.RESULTS_DETAIL(id));
      if (res.success) {
        toast.success('Catatan hasil tes fisik berhasil dihapus!');
        fetchData();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus catatan');
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_id || !formData.test_type_id || !formData.result_value) {
      return toast.error('Harap lengkapi semua kolom!');
    }

    setIsLoading(true);
    try {
      let res;
      if (editingResult) {
        res = await request.put(API_ENDPOINTS.PHYSICAL_TESTS.RESULTS_DETAIL(editingResult.id), formData);
      } else {
        res = await request.post(API_ENDPOINTS.PHYSICAL_TESTS.RESULTS_CREATE, formData);
      }
      if (res.success) {
        toast.success(editingResult ? 'Catatan hasil tes diperbarui!' : `Hasil tes disimpan! Evaluasi: ${res.evaluation}`);
        setIsModalOpen(false);
        setEditingResult(null);
        setFormData({
          member_id: '',
          test_type_id: '',
          date: new Date().toISOString().split('T')[0],
          target_value: '',
          result_value: '',
          notes: ''
        });
        setSearchVal('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    if (!typeData.name) return toast.error('Harap isi nama jenis tes!');

    setIsLoading(true);
    try {
      const res = await request.post(API_ENDPOINTS.PHYSICAL_TESTS.TYPES_CREATE, typeData);
      if (res.success) {
        toast.success('Jenis tes fisik berhasil dibuat!');
        setIsTypeModalOpen(false);
        setTypeData({ name: '', category: 'Speed', description: '' });
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
          <h2 className="text-xl font-bold text-slate-100">Evaluasi & Tes Fisik</h2>
          <p className="text-xs text-slate-400">Ukur and bandingkan metrik pencapaian fisik atlet otomatis</p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTypeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Master Jenis Tes
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Input Hasil Tes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Riwayat Catatan Tes
        </button>
        <button
          onClick={() => setActiveTab('grouped')}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'grouped'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Data Per Orang
        </button>
      </div>

      {/* Grid of Results */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <h3 className="font-bold text-sm text-slate-800">
            {activeTab === 'history' ? 'Riwayat Catatan Tes' : 'Data Catatan Uji Fisik Per Orang'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={downloadExcel}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
            >
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button
              onClick={downloadPDF}
              className="px-3 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-md shadow-red-600/10"
            >
              <FileText size={13} /> PDF
            </button>
          </div>
        </div>
        
        {testResults.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">Belum ada catatan hasil uji fisik.</p>
        ) : activeTab === 'history' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th className="py-3 px-2">Atlet</th>
                  <th className="py-3 px-2">Tanggal</th>
                  <th className="py-3 px-2">Jenis Tes</th>
                  <th className="py-3 px-2">Target vs Hasil</th>
                  <th className="py-3 px-2">Analisa / Evaluasi</th>
                  <th className="py-3 px-2">Perkembangan</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {testResults.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-2 font-semibold text-slate-800">{r.member_name}</td>
                    <td className="py-3 px-2 text-slate-500">{new Date(r.date).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-2 text-slate-655 font-medium">{r.test_name}</td>
                    <td className="py-3 px-2 text-slate-600">
                      Target: <span className="font-medium text-slate-500">{r.target_value}</span> • Hasil: <span className="font-bold text-blue-600">{r.result_value}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600 leading-normal">{r.evaluation}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-0.5 ${
                        r.status === 'naik' ? 'bg-green-500/10 text-green-700 border border-green-500/20' :
                        r.status === 'turun' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                        'bg-slate-100 border border-slate-200 text-slate-600'
                      }`}>
                        {r.status === 'naik' && <ArrowUpRight size={11} />}
                        {r.status === 'turun' && <ArrowDownRight size={11} />}
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => startEditResult(r)}
                          className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleResultDelete(r.id)}
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
        ) : (
          /* Grouped by Athlete Accordion Sub-tables View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase">
                  <th style={{ width: '40px' }} className="py-3 px-2">No</th>
                  <th className="py-3 px-2">Nama Atlet</th>
                  <th className="py-3 px-2">Jumlah Uji Fisik</th>
                  <th className="py-3 px-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const groupedResults = testResults.reduce((acc, curr) => {
                    if (!acc[curr.member_id]) {
                      acc[curr.member_id] = {
                        member_id: curr.member_id,
                        member_name: curr.member_name,
                        results: []
                      };
                    }
                    acc[curr.member_id].results.push(curr);
                    return acc;
                  }, {});
                  const groupedList = Object.values(groupedResults);

                  return groupedList.map((g, idx) => {
                    const isExpanded = expandedMemberId === g.member_id;
                    return (
                      <React.Fragment key={g.member_id}>
                        <tr 
                          className="hover:bg-slate-50 transition-colors cursor-pointer"
                          onClick={() => setExpandedMemberId(isExpanded ? null : g.member_id)}
                        >
                          <td className="py-3 px-2 text-slate-500 font-semibold">{idx + 1}</td>
                          <td className="py-3 px-2 font-semibold text-slate-800 flex items-center gap-1.5">
                            {isExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                            {g.member_name}
                          </td>
                          <td className="py-3 px-2 text-slate-655 font-medium">{g.results.length} Tes</td>
                          <td className="py-3 px-2 text-right">
                            <button 
                              className="text-xs font-semibold text-blue-600 hover:text-blue-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedMemberId(isExpanded ? null : g.member_id);
                              }}
                            >
                              {isExpanded ? 'Tutup Riwayat' : 'Lihat Riwayat'}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan="4" className="p-0 bg-slate-50/50">
                              <div className="p-4 border-t border-b border-slate-100 space-y-3">
                                <h4 className="font-semibold text-slate-700 text-xs uppercase tracking-wider">Catatan Uji Fisik: {g.member_name}</h4>
                                <table className="w-full text-left text-xs bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                  <thead>
                                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold">
                                      <th className="p-2.5">Tanggal</th>
                                      <th className="p-2.5">Jenis Tes</th>
                                      <th className="p-2.5">Target vs Hasil</th>
                                      <th className="p-2.5">Analisa / Evaluasi</th>
                                      <th className="p-2.5 text-center">Status</th>
                                      <th className="p-2.5 text-right">Aksi</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {g.results.map(r => (
                                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-2.5 text-slate-500 whitespace-nowrap">{new Date(r.date).toLocaleDateString('id-ID')}</td>
                                        <td className="p-2.5 text-slate-700 font-medium">{r.test_name}</td>
                                        <td className="p-2.5 text-slate-600 whitespace-nowrap">
                                          Target: <span className="font-medium text-slate-500">{r.target_value}</span> • Hasil: <span className="font-bold text-blue-600">{r.result_value}</span>
                                        </td>
                                        <td className="p-2.5 text-slate-600 leading-normal">{r.evaluation}</td>
                                        <td className="p-2.5 text-center">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-0.5 ${
                                            r.status === 'naik' ? 'bg-green-500/10 text-green-700 border border-green-500/20' :
                                            r.status === 'turun' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                                            'bg-slate-100 border border-slate-200 text-slate-600'
                                          }`}>
                                            {r.status === 'naik' && <ArrowUpRight size={11} />}
                                            {r.status === 'turun' && <ArrowDownRight size={11} />}
                                            {r.status}
                                          </span>
                                        </td>
                                        <td className="p-2.5 text-right whitespace-nowrap">
                                          <div className="flex justify-end gap-1.5">
                                            <button 
                                              onClick={() => startEditResult(r)}
                                              className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                                              title="Edit"
                                            >
                                              <Edit size={14} />
                                            </button>
                                            <button 
                                              onClick={() => handleResultDelete(r.id)}
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
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Input Hasil Tes Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingResult(null); 
          setFormData({
            member_id: '',
            test_type_id: '',
            date: new Date().toISOString().split('T')[0],
            target_value: '',
            result_value: '',
            notes: ''
          });
          setSearchVal('');
        }} 
        title={editingResult ? "Edit Catatan Hasil Uji Fisik" : "Input Hasil Uji Fisik Atlet"}
      >
        <form onSubmit={handleResultSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Atlet */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Pilih Atlet *</label>
              <Select
                value={selectOptions.find(o => o.value === formData.member_id) || null}
                onChange={(selected) => setFormData(prev => ({ ...prev, member_id: selected ? selected.value : '' }))}
                onInputChange={(newValue) => setSearchVal(newValue)}
                options={selectOptions}
                isLoading={isSelectLoading}
                placeholder="Cari & pilih atlet..."
                styles={selectStyles}
                noOptionsMessage={() => "Atlet tidak ditemukan"}
                isClearable
              />
            </div>

            {/* Jenis Tes */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Jenis Tes Fisik *</label>
              <select
                value={formData.test_type_id}
                onChange={(e) => setFormData(prev => ({ ...prev, test_type_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
                required
              >
                <option value="">Pilih Jenis Tes</option>
                {testTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tanggal Tes *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>

            {/* Target Value */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Target Sasaran (Angka) *</label>
              <input
                type="text"
                placeholder="Contoh: 12.00 atau 40"
                value={formData.target_value}
                onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>

            {/* Actual Result */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Hasil Pencapaian Atlet *</label>
              <input
                type="text"
                placeholder="Contoh: 11.8 atau 35"
                value={formData.result_value}
                onChange={(e) => setFormData(prev => ({ ...prev, result_value: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Catatan Tambahan Evaluasi</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => { 
                setIsModalOpen(false); 
                setEditingResult(null); 
                setFormData({
                  member_id: '',
                  test_type_id: '',
                  date: new Date().toISOString().split('T')[0],
                  target_value: '',
                  result_value: '',
                  notes: ''
                });
                setSearchVal('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-lg"
            >
              {isLoading ? 'Menyimpan...' : (editingResult ? 'Simpan Perubahan' : 'Simpan Hasil')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Test Type Modal */}
      <Modal isOpen={isTypeModalOpen} onClose={() => setIsTypeModalOpen(false)} title="Buat Kategori Tes Fisik Baru">
        <form onSubmit={handleTypeSubmit} className="space-y-5 text-xs text-slate-350">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Nama Pengujian Fisik *</label>
            <input
              type="text"
              placeholder="Contoh: Shuttle Run 4x10m"
              value={typeData.name}
              onChange={(e) => setTypeData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Kategori Parameter *</label>
            <select
              value={typeData.category}
              onChange={(e) => setTypeData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200"
            >
              <option value="Speed">Speed / Kecepatan</option>
              <option value="Power">Power / Kekuatan</option>
              <option value="Endurance">Endurance / Daya Tahan</option>
              <option value="Flexibility">Flexibility / Kelenturan</option>
              <option value="Agility">Agility / Kelincahan</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Deskripsi / Metode Penilaian</label>
            <textarea
              rows="3"
              placeholder="Jelaskan cara pengukuran dan unit satuan (meter, kali, detik)..."
              value={typeData.description}
              onChange={(e) => setTypeData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-850 pt-4">
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-850 text-slate-300"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
            >
              Buat Kategori
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
