import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import {
  Search, Plus, Eye, Edit, Trash2, ShieldAlert,
  FileText, Download, Printer, User, Phone, MapPin, Calendar, HelpCircle, Home
} from 'lucide-react';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [belts, setBelts] = useState([]);
  const [classes, setClasses] = useState([]);

  // Filtering & Pagination State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [beltFilter, setBeltFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('Tambah Anggota');
  const [editId, setEditId] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    gender: 'L',
    birth_place: '',
    birth_date: '',
    parent_name: '',
    whatsapp: '',
    school: '',
    dojang: '',
    belt_id: '',
    weight: '',
    height: '',
    blood_type: '-',
    address: '',
    status: 'aktif',
    joined_date: '',
    notes: '',
    class_ids: []
  });

  // File Upload State
  const [photo, setPhoto] = useState(null);
  const [docAkta, setDocAkta] = useState(null);
  const [docKk, setDocKk] = useState(null);
  const [docPhoto, setDocPhoto] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  // Debouncing search input (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Load Initial Data
  useEffect(() => {
    async function loadMasters() {
      try {
        const beltRes = await request.get(API_ENDPOINTS.BELTS.LIST);
        const classRes = await request.get(API_ENDPOINTS.CLASSES.LIST);
        if (beltRes.success) setBelts(beltRes.data);
        if (classRes.success) setClasses(classRes.data);
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    }
    loadMasters();
  }, []);

  // Fetch Members List
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const response = await request.get(API_ENDPOINTS.MEMBERS.LIST, {
        page,
        limit,
        search: debouncedSearch,
        belt_id: beltFilter,
        status: statusFilter
      });
      if (response.success) {
        setMembers(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, limit, debouncedSearch, beltFilter, statusFilter]);

  // Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      return toast.error('Lengkapi semua kolom wajib (Nama)!');
    }

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'class_ids') {
        formData.class_ids.forEach(cid => payload.append('class_ids', cid));
      } else {
        payload.append(key, formData[key]);
      }
    });

    if (photo) payload.append('photo', photo);
    if (docAkta) payload.append('doc_akta', docAkta);
    if (docKk) payload.append('doc_kk', docKk);
    if (docPhoto) payload.append('doc_photo', docPhoto);

    setIsLoading(true);
    try {
      let res;
      if (editId) {
        res = await request.put(API_ENDPOINTS.MEMBERS.UPDATE(editId), payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await request.post(API_ENDPOINTS.MEMBERS.CREATE, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.success) {
        toast.success(editId ? 'Anggota berhasil diupdate!' : 'Anggota berhasil ditambahkan!');
        setIsModalOpen(false);
        resetForm();
        fetchMembers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Form Modal
  const handleEdit = async (member) => {
    setModalTitle('Edit Data Anggota');
    setEditId(member.id);

    // Fetch details to get classes
    try {
      const detailRes = await request.get(API_ENDPOINTS.MEMBERS.DETAIL(member.id));
      if (detailRes.success) {
        const m = detailRes.data;
        setFormData({
          name: m.name || '',
          gender: m.gender || 'L',
          birth_place: m.birth_place || '',
          birth_date: m.birth_date ? m.birth_date.split('T')[0] : '',
          parent_name: m.parent_name || '',
          whatsapp: m.whatsapp || '',
          school: m.school || '',
          dojang: m.dojang || '',
          belt_id: m.belt_id || '',
          weight: m.weight || '',
          height: m.height || '',
          blood_type: m.blood_type || '-',
          address: m.address || '',
          status: m.status || 'aktif',
          joined_date: m.joined_date ? m.joined_date.split('T')[0] : '',
          notes: m.notes || '',
          class_ids: m.classes ? m.classes.map(c => c.id) : []
        });
        setIsModalOpen(true);
      }
    } catch (err) {
      toast.error('Gagal mengambil data lengkap anggota');
    }
  };

  // Delete Action Confirmation Toast
  const handleDelete = (id, name) => {
    toast((t) => (
      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-slate-800">
          Apakah Anda yakin ingin menghapus data <strong>{name}</strong>?
        </span>
        <div className="flex justify-end gap-2 text-xs">
          <button
            className="px-3 py-1 bg-slate-200 hover:bg-slate-300 rounded font-medium text-slate-800"
            onClick={() => toast.dismiss(t.id)}
          >
            Batal
          </button>
          <button
            className="px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-500"
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await request.delete(API_ENDPOINTS.MEMBERS.DELETE(id));
                if (res.success) {
                  toast.success('Anggota berhasil dihapus!');
                  fetchMembers();
                }
              } catch (err) {
                console.error(err);
              }
            }}
          >
            Hapus
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'L',
      birth_place: '',
      birth_date: '',
      parent_name: '',
      whatsapp: '',
      school: '',
      dojang: '',
      belt_id: '',
      weight: '',
      height: '',
      blood_type: '-',
      address: '',
      status: 'aktif',
      joined_date: '',
      notes: '',
      class_ids: []
    });
    setPhoto(null);
    setDocAkta(null);
    setDocKk(null);
    setDocPhoto(null);
    setEditId(null);
  };

  const handleClassChange = (cid) => {
    const isSelected = formData.class_ids.includes(cid);
    if (isSelected) {
      setFormData(prev => ({ ...prev, class_ids: prev.class_ids.filter(id => id !== cid) }));
    } else {
      setFormData(prev => ({ ...prev, class_ids: [...prev.class_ids, cid] }));
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Master Data Anggota</h2>
          <p className="text-xs text-slate-400">Total {total} anggota terdaftar</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={printReport}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer size={15} /> Cetak
          </button>
          <button
            onClick={() => {
              setModalTitle('Tambah Anggota Baru');
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} /> Tambah Anggota
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Cari nama, no. anggota, WA, sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-100 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
          <select
            value={beltFilter}
            onChange={(e) => setBeltFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Semua Sabuk</option>
            {belts.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
            <option value="lulus">Lulus</option>
            <option value="keluar">Keluar</option>
          </select>
        </div>
      </div>

      {/* Members Grid/Table */}
      <div className="glass-panel rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span>Memuat data...</span>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
            <HelpCircle size={40} className="text-slate-600" />
            <p>Tidak ada data anggota ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-4">Anggota</th>
                  <th className="p-4">Sabuk</th>
                  <th className="p-4">Kontak / Sekolah</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map(member => (
                  <tr key={member.id} className="hover:bg-slate-850/40 transition-colors">
                    {/* User profile picture */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center">
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="text-slate-500" />
                          )}
                        </div>
                        <div>
                          <Link to={`/members/${member.id}`} className="font-semibold text-slate-200 hover:text-blue-400 text-sm block">
                            {member.name}
                          </Link>
                          {/* <span className="text-[10px] text-slate-500">{member.member_number}</span> */}
                        </div>
                      </div>
                    </td>

                    {/* Belt color info */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded border border-slate-700 bg-slate-200`} style={{
                          backgroundColor: member.belt_id === 1 ? '#ffffff' :
                            member.belt_id === 2 ? '#fbbf24' :
                              member.belt_id === 4 ? '#22c55e' :
                                member.belt_id === 6 ? '#3b82f6' :
                                  member.belt_id === 8 ? '#ef4444' : '#0f172a'
                        }} />
                        <span className="font-medium text-slate-300">{member.belt_name}</span>
                      </div>
                    </td>

                    {/* School/WhatsApp */}
                    <td className="p-4 text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone size={12} className="text-slate-600" />
                        <span>{member.whatsapp}</span>
                      </div>
                      {member.school && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <MapPin size={12} className="text-slate-600" />
                          <span className="truncate w-40">{member.school}</span>
                        </div>
                      )}
                      {member.dojang && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-400">
                          <Home size={12} className="text-blue-500" />
                          <span className="truncate w-40">{member.dojang}</span>
                        </div>
                      )}
                    </td>

                    {/* Status badges */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${member.status === 'aktif' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          member.status === 'tidak_aktif' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            member.status === 'lulus' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                        }`}>
                        {member.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/members/${member.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                          title="Detail Profile"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => handleEdit(member)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id, member.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        <Pagination
          page={page}
          limit={limit}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Form Modal popup container */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Nama Lengkap */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nama Lengkap *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* No WhatsApp */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nomor WhatsApp</label>
              <input
                type="text"
                placeholder="0812xxxxxxxx"
                value={formData.whatsapp}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Jenis Kelamin *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* Belt */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tingkat Sabuk</label>
              <select
                value={formData.belt_id}
                onChange={(e) => setFormData(prev => ({ ...prev, belt_id: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Pilih Sabuk</option>
                {belts.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Birth Place */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tempat Lahir</label>
              <input
                type="text"
                value={formData.birth_place}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_place: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Birth Date */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Berat Badan (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Height */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Tinggi Badan (cm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* School */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Sekolah / Instansi</label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Dojang */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Dojang / Tempat Latihan</label>
              <input
                type="text"
                placeholder="Contoh: CITAPEN / DADAHA"
                value={formData.dojang}
                onChange={(e) => setFormData(prev => ({ ...prev, dojang: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Parent Name */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Nama Orang Tua</label>
              <input
                type="text"
                value={formData.parent_name}
                onChange={(e) => setFormData(prev => ({ ...prev, parent_name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Classes checklists */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300 block">Kelas Latihan</label>
            <div className="flex flex-wrap gap-2.5">
              {classes.map(c => (
                <label
                  key={c.id}
                  className={`px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer transition-all ${formData.class_ids.includes(c.id)
                      ? 'bg-blue-600/10 border-blue-500 text-blue-400'
                      : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.class_ids.includes(c.id)}
                    onChange={() => handleClassChange(c.id)}
                    className="hidden"
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alamat */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Alamat Lengkap</label>
            <textarea
              rows="2"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Document Uploads */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">Pas Foto</label>
              <input
                type="file"
                onChange={(e) => setPhoto(e.target.files[0])}
                className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500 block">Scan Akta Kelahiran</label>
              <input
                type="file"
                onChange={(e) => setDocAkta(e.target.files[0])}
                className="w-full text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-medium transition-colors text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/10"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
