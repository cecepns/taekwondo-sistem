import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import AsyncSelect from 'react-select/async';
import {
  Search, Plus, Eye, Printer, FileText, Trash2, Calendar, Edit,
  FileSpreadsheet, HelpCircle, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function Dues({ user, settings }) {
  const [dues, setDues] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDue, setEditingDue] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'unpaid'

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterDojang, setFilterDojang] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '', 'sudah_bayar', 'belum_bayar'
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Unpaid Tab State
  const [unpaidDues, setUnpaidDues] = useState([]);
  const [isUnpaidLoading, setIsUnpaidLoading] = useState(false);
  const [unpaidSearch, setUnpaidSearch] = useState('');

  // Modal payment state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    member_id: '',
    months: [],
    year: new Date().getFullYear(),
    amount: '',
    method: 'cash',
    notes: ''
  });
  const [attachment, setAttachment] = useState(null);

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Helper to filter dues dynamically
  const getFilteredDuesList = (allDuesTransactions) => {
    let filtered = [];

    if (filterStatus === 'belum_bayar') {
      const targetMonth = filterMonth || String(new Date().getMonth() + 1);
      const targetYear = filterYear || new Date().getFullYear();

      let activeMembers = members.filter(m => m.status === 'aktif');

      if (search) {
        activeMembers = activeMembers.filter(m =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.member_number.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (filterDojang) {
        activeMembers = activeMembers.filter(m => m.dojang === filterDojang);
      }

      filtered = activeMembers.filter(m => {
        const hasPaid = allDuesTransactions.some(d =>
          parseInt(d.member_id) === parseInt(m.id) &&
          parseInt(d.month) === parseInt(targetMonth) &&
          parseInt(d.year) === parseInt(targetYear) &&
          d.status === 'sudah_bayar'
        );
        return !hasPaid;
      }).map(m => ({
        id: `unpaid-${m.id}-${targetMonth}-${targetYear}`,
        member_id: m.id,
        member_name: m.name,
        member_number: m.member_number,
        member_dojang: m.dojang,
        month: targetMonth,
        year: targetYear,
        amount: parseFloat(settings?.default_dues_amount || 85000),
        payment_date: '-',
        method: '-',
        status: 'belum_bayar',
        notes: 'Belum dibayar'
      }));

    } else {
      filtered = allDuesTransactions;

      if (search) {
        filtered = filtered.filter(d =>
          d.member_name.toLowerCase().includes(search.toLowerCase()) ||
          d.member_number.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (filterMonth) {
        filtered = filtered.filter(d => parseInt(d.month) === parseInt(filterMonth));
      }
      if (filterYear) {
        filtered = filtered.filter(d => parseInt(d.year) === parseInt(filterYear));
      }

      if (filterDojang) {
        filtered = filtered.filter(d => d.member_dojang === filterDojang);
      }

      if (filterStatus === 'sudah_bayar') {
        filtered = filtered.filter(d => d.status === 'sudah_bayar');
      }
    }
    return filtered;
  };

  const fetchDues = async () => {
    setIsLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DUES.LIST);
      if (res.success) {
        const filtered = getFilteredDuesList(res.data || []);
        const offset = (page - 1) * limit;
        setDues(filtered.slice(offset, offset + limit));
        setTotal(filtered.length);
        setTotalPages(Math.ceil(filtered.length / limit));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnpaidDues = async () => {
    setIsUnpaidLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.DUES.UNPAID);
      if (res.success) {
        setUnpaidDues(res.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data tagihan iuran');
    } finally {
      setIsUnpaidLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchDues();
    } else {
      fetchUnpaidDues();
    }
  }, [page, limit, search, filterMonth, filterYear, filterDojang, filterStatus, activeTab, members.length]);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await request.get(API_ENDPOINTS.MEMBERS.LIST + '?limit=1000');
        if (res.success) setMembers(res.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadMembers();
  }, []);

  const loadMembersOptions = async (inputValue) => {
    try {
      const res = await request.get(`${API_ENDPOINTS.MEMBERS.LIST}?search=${inputValue}&limit=50`);
      if (res.success && res.data) {
        return res.data.map(m => ({
          value: m.id,
          label: `${m.name} (${m.member_number})`
        }));
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const handleMonthToggle = (month) => {
    const isSelected = paymentForm.months.includes(month);
    let updatedMonths = [];
    if (isSelected) {
      updatedMonths = paymentForm.months.filter(m => m !== month);
    } else {
      updatedMonths = [...paymentForm.months, month];
    }

    const duesRate = parseFloat(settings?.default_dues_amount) || 85000;
    const estimatedFee = updatedMonths.length * duesRate;
    setPaymentForm(prev => ({
      ...prev,
      months: updatedMonths,
      amount: estimatedFee ? String(estimatedFee) : ''
    }));
  };

  const startEditDue = (d) => {
    setEditingDue(d);
    setPaymentForm({
      member_id: d.member_id,
      months: [d.month],
      year: d.year,
      amount: String(d.amount),
      method: d.method || 'cash',
      notes: d.notes || '',
      status: d.status || 'sudah_bayar'
    });
    setIsModalOpen(true);
  };

  const handleDueDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi iuran ini?')) return;
    try {
      const res = await request.delete(API_ENDPOINTS.DUES.DETAIL(id));
      if (res.success) {
        toast.success('Catatan transaksi iuran berhasil dihapus!');
        fetchDues();
      }
    } catch (e) {
      console.error(e);
      toast.error('Gagal menghapus transaksi iuran');
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.member_id || paymentForm.months.length === 0 || !paymentForm.amount) {
      return toast.error('Lengkapi form iuran terlebih dahulu!');
    }

    const payload = new FormData();
    payload.append('member_id', paymentForm.member_id);
    if (editingDue) {
      payload.append('month', paymentForm.months[0]);
      payload.append('status', paymentForm.status);
    } else {
      payload.append('months', JSON.stringify(paymentForm.months));
    }
    payload.append('year', paymentForm.year);
    payload.append('amount', paymentForm.amount);
    payload.append('method', paymentForm.method);
    payload.append('notes', paymentForm.notes);
    if (attachment) payload.append('attachment', attachment);

    setIsLoading(true);
    try {
      let res;
      if (editingDue) {
        res = await request.put(API_ENDPOINTS.DUES.DETAIL(editingDue.id), payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await request.post(API_ENDPOINTS.DUES.PAY, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      if (res.success) {
        toast.success(editingDue ? 'Data iuran berhasil diperbarui!' : 'Pembayaran iuran berhasil disimpan!');
        setIsModalOpen(false);
        setEditingDue(null);
        resetForm();
        if (activeTab === 'list') {
          fetchDues();
        } else {
          fetchUnpaidDues();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPaymentForm({
      member_id: '',
      months: [],
      year: new Date().getFullYear(),
      amount: '',
      method: 'cash',
      notes: '',
      status: 'sudah_bayar'
    });
    setAttachment(null);
  };

  const getMonthName = (mNum) => {
    const names = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return names[mNum - 1] || '';
  };

  const handlePayUnpaid = (unpaidInfo) => {
    const firstUnpaid = unpaidInfo.unpaid_months[0];
    const year = firstUnpaid ? firstUnpaid.year : new Date().getFullYear();
    const monthsInYear = unpaidInfo.unpaid_months.filter(m => m.year === year).map(m => m.month);

    const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;
    const totalAmount = monthsInYear.length * defaultDuesRate;

    setPaymentForm({
      member_id: unpaidInfo.member_id,
      months: monthsInYear,
      year: year,
      amount: String(totalAmount),
      method: 'cash',
      notes: `Pelunasan tagihan bulan: ${monthsInYear.map(m => getMonthName(m)).join(', ')} (${year})`,
      status: 'sudah_bayar'
    });
    setIsModalOpen(true);
  };

  const printInvoice = (unpaidInfo) => {
    const printWindow = window.open('', '_blank');
    const systemName = settings?.app_name || 'Taekwondo Club Management';
    const dojangName = settings?.dojang_name || 'Dojang Taekwondo';
    const dojangAddress = settings?.address || '';
    const dojangWa = settings?.whatsapp || '';
    const dojangEmail = settings?.email || '';

    const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice Tagihan - ${unpaidInfo.member_name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 40px; line-height: 1.6; background-color: #fff; }
            .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
            .logo-area h2 { margin: 0; color: #0f172a; font-size: 24px; font-weight: 800; text-transform: uppercase; }
            .logo-area p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
            .invoice-details { text-align: right; }
            .invoice-details h3 { margin: 0; color: #2563eb; font-size: 20px; font-weight: 700; }
            .invoice-details p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
            .info-section { display: flex; justify-content: space-between; margin-bottom: 32px; font-size: 14px; }
            .info-box h4 { margin: 0 0 8px 0; color: #475569; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
            .info-box p { margin: 4px 0; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
            th { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px 16px; text-align: left; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 12px; }
            td { border-bottom: 1px solid #f1f5f9; padding: 16px; color: #334155; }
            .text-right { text-align: right; }
            .total-row td { font-weight: 700; font-size: 16px; color: #0f172a; background-color: #f8fafc; border-top: 2px solid #e2e8f0; }
            .payment-instructions { margin-top: 40px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; font-size: 13px; }
            .payment-instructions h5 { margin: 0 0 8px 0; color: #0f172a; font-size: 14px; font-weight: 600; }
            .payment-instructions p { margin: 4px 0; color: #475569; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print {
              body { padding: 0; background-color: transparent; }
              .invoice-card { border: none; padding: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-card">
            <div class="header">
              <div class="logo-area">
                <h2>${dojangName}</h2>
                <p>${systemName}</p>
                ${dojangAddress ? `<p>${dojangAddress}</p>` : ''}
              </div>
              <div class="invoice-details">
                <h3>TAGIHAN IURAN</h3>
                <p>Tanggal Tagihan: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <p>Status: <span style="color: #dc2626; font-weight: bold; text-transform: uppercase;">BELUM LUNAS</span></p>
              </div>
            </div>

            <div class="info-section">
              <div class="info-box">
                <h4>Ditujukan Kepada:</h4>
                <p style="font-weight: bold; font-size: 16px;">${unpaidInfo.member_name}</p>
                <p>No. Anggota: ${unpaidInfo.member_number}</p>
              </div>
              <div class="info-box" style="text-align: right;">
                <h4>Kontak Pengelola:</h4>
                ${dojangWa ? `<p>WhatsApp: ${dojangWa}</p>` : ''}
                ${dojangEmail ? `<p>Email: ${dojangEmail}</p>` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">No</th>
                  <th>Deskripsi Item</th>
                  <th class="text-right">Bulan Tagihan</th>
                  <th class="text-right" style="width: 120px;">Tarif Bulanan</th>
                </tr>
              </thead>
              <tbody>
                ${unpaidInfo.unpaid_months.map((m, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td style="font-weight: 500;">Iuran Bulanan Taekwondo</td>
                    <td class="text-right">${getMonthName(m.month)} ${m.year}</td>
                    <td class="text-right">Rp ${parseFloat(defaultDuesRate).toLocaleString()}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="3" class="text-right">TOTAL TAGIHAN (${unpaidInfo.total_unpaid} Bulan):</td>
                  <td class="text-right">Rp ${parseFloat(unpaidInfo.total_bill).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="payment-instructions">
              <h5>Petunjuk Pembayaran:</h5>
              <p>1. Pembayaran dapat dilakukan secara tunai (Cash) langsung kepada petugas keuangan dojang.</p>
              <p>2. Atau transfer melalui rekening resmi dojang/QRIS yang tersedia di konter pendaftaran.</p>
              <p>3. Setelah melakukan transfer, harap kirimkan bukti transfer ke WhatsApp Pengelola: <strong>${dojangWa || '-'}</strong> untuk diverifikasi.</p>
            </div>

            <div class="footer">
              <p>Terima kasih atas partisipasi dan dukungan Anda dalam latihan Taekwondo.</p>
              <p>© ${new Date().getFullYear()} ${dojangName}. Seluruh hak cipta dilindungi.</p>
            </div>
          </div>
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

  const downloadDuesExcel = () => {
    const runDownload = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.DUES.LIST);
        if (res.success) {
          const list = getFilteredDuesList(res.data || []);

          const headers = ['No', 'Nama Anggota', 'No Anggota', 'Iuran Bulan', 'Tahun', 'Tanggal Bayar', 'Nominal', 'Metode Bayar', 'Status'];
          const rows = list.map((d, index) => [
            index + 1,
            d.member_name,
            d.member_number,
            getMonthName(d.month),
            d.year,
            d.payment_date !== '-' ? new Date(d.payment_date).toLocaleDateString('id-ID') : '-',
            `Rp ${parseFloat(d.amount).toLocaleString()}`,
            d.method.toUpperCase(),
            d.status.toUpperCase()
          ]);

          const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `Laporan_Iuran_${filterMonth ? `Bulan_${filterMonth}` : 'Semua_Bulan'}_${filterYear}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal mendownload excel');
      }
    };
    runDownload();
  };

  const downloadDuesPdf = () => {
    const runDownload = async () => {
      try {
        const res = await request.get(API_ENDPOINTS.DUES.LIST);
        if (res.success) {
          const list = getFilteredDuesList(res.data || []);

          const printWindow = window.open('', '_blank');
          const titleStr = `Laporan Iuran Keuangan - ${filterMonth ? getMonthName(parseInt(filterMonth)) : 'Semua Bulan'} ${filterYear}`;

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
                  .text-right { text-align: right; font-weight: bold; }
                  .status { font-weight: bold; text-transform: uppercase; }
                  .status-sudah_bayar { color: #16a34a; }
                  .status-belum_bayar { color: #dc2626; }
                  .status-menunggak { color: #d97706; }
                </style>
              </head>
              <body>
                <h2>${titleStr}</h2>
                <p>Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <table>
                  <thead>
                    <tr>
                      <th style="width: 40px;" class="text-center">No</th>
                      <th>Nama Anggota</th>
                      <th>No Anggota</th>
                      <th>Iuran Bulan</th>
                      <th>Tanggal Bayar</th>
                      <th>Metode</th>
                      <th>Status</th>
                      <th class="text-right">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${list.map((d, idx) => `
                      <tr>
                        <td class="text-center">${idx + 1}</td>
                        <td style="font-weight: 500;">${d.member_name}</td>
                        <td>${d.member_number}</td>
                        <td>${getMonthName(d.month)} ${d.year}</td>
                        <td>${d.payment_date !== '-' ? new Date(d.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                        <td style="text-transform: uppercase;">${d.method}</td>
                        <td class="status status-${d.status}">${d.status.replace('_', ' ')}</td>
                        <td class="text-right">Rp ${parseFloat(d.amount).toLocaleString()}</td>
                      </tr>
                    `).join('')}
                    <tr>
                      <td colspan="7" class="text-right" style="padding-top: 15px; border-bottom: none;">${filterStatus === 'belum_bayar' ? 'TOTAL TAGIHAN BELUM DIBAYAR:' : 'TOTAL PENERIMAAN:'}</td>
                      <td class="text-right" style="padding-top: 15px; border-bottom: none; font-size: 13px; color: #1e293b;">
                        Rp ${list.reduce((sum, d) => sum + parseFloat(d.amount), 0).toLocaleString()}
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
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal mendownload PDF');
      }
    };
    runDownload();
  };

  const downloadUnpaidExcel = () => {
    try {
      const headers = ['No', 'Nama Anggota', 'No Anggota', 'Dojang', 'Jumlah Tunggakan', 'Bulan Tunggakan', 'Total Tagihan'];
      const rows = filteredUnpaidDues.map((u, index) => {
        const filteredMonths = u.unpaid_months.filter(m => {
          const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
          const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
          return matchesM && matchesY;
        });
        const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;
        const bill = filteredMonths.length * defaultDuesRate;

        return [
          index + 1,
          u.member_name,
          u.member_number,
          u.dojang || '-',
          `${filteredMonths.length} Bulan`,
          filteredMonths.map(m => `${getMonthName(m.month)} ${m.year}`).join('; '),
          `Rp ${bill.toLocaleString()}`
        ];
      });

      const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filename = `Laporan_Tunggakan_Iuran_${filterDojang ? `Dojang_${filterDojang}_` : ''}${filterMonth ? `Bulan_${filterMonth}_` : ''}${filterYear}.csv`;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mendownload Excel tunggakan');
    }
  };

  const downloadUnpaidPdf = () => {
    try {
      const printWindow = window.open('', '_blank');
      const titleStr = `Laporan Tunggakan Tagihan - ${filterMonth ? getMonthName(parseInt(filterMonth)) : 'Semua Bulan'} ${filterYear}`;

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
              .text-right { text-align: right; font-weight: bold; }
              .status { font-weight: bold; text-transform: uppercase; color: #dc2626; }
            </style>
          </head>
          <body>
            <h2>${titleStr}</h2>
            <p>Dojang: ${filterDojang || 'Semua Dojang'} | Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <table>
              <thead>
                <tr>
                  <th style="width: 40px;" class="text-center">No</th>
                  <th>Nama Anggota</th>
                  <th>No Anggota</th>
                  <th>Dojang</th>
                  <th>Bulan Tunggakan</th>
                  <th class="text-center">Jumlah</th>
                  <th class="text-right">Total Tagihan</th>
                </tr>
              </thead>
              <tbody>
                \${filteredUnpaidDues.map((u, idx) => {
                  const filteredMonths = u.unpaid_months.filter(m => {
                    const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                    const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                    return matchesM && matchesY;
                  });
                  const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;
                  const bill = filteredMonths.length * defaultDuesRate;
                  return \`
                    <tr>
                      <td class="text-center">\${idx + 1}</td>
                      <td style="font-weight: 500;">\${u.member_name}</td>
                      <td>\${u.member_number}</td>
                      <td>\${u.dojang || '-'}</td>
                      <td>
                        \${filteredMonths.map(m => getMonthName(m.month) + ' ' + m.year).join(', ')}
                      </td>
                      <td class="text-center font-semibold text-red-650">\${filteredMonths.length} Bulan</td>
                      <td class="text-right">Rp \${bill.toLocaleString()}</td>
                    </tr>
                  \`;
                }).join('')}
                <tr>
                  <td colspan="6" class="text-right" style="padding-top: 15px; border-bottom: none;">ESTIMASI TOTAL TAGIHAN TUNGGAKAN:</td>
                  <td class="text-right" style="padding-top: 15px; border-bottom: none; font-size: 13px; color: #dc2626;">
                    Rp \${filteredUnpaidDues.reduce((sum, u) => {
                      const filteredMonths = u.unpaid_months.filter(m => {
                        const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                        const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                        return matchesM && matchesY;
                      });
                      const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;
                      return sum + (filteredMonths.length * defaultDuesRate);
                    }, 0).toLocaleString()}
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
    } catch (err) {
      console.error(err);
      toast.error('Gagal mencetak PDF');
    }
  };

  const reactSelectCustomStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: '#f8fafc',
      borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
      borderRadius: '0.75rem',
      fontSize: '12px',
      color: '#1e293b',
      minHeight: '38px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#3b82f6'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      zIndex: 9999
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
          ? '#f1f5f9'
          : 'transparent',
      color: state.isSelected ? '#ffffff' : '#334155',
      fontSize: '12px',
      cursor: 'pointer'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#1e293b'
    }),
    input: (provided) => ({
      ...provided,
      color: '#1e293b'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8'
    })
  };

  const dojangsList = [...new Set(members.map(m => m.dojang).filter(Boolean))];

  const filteredUnpaidDues = unpaidDues.filter(u => {
    const matchesSearch = u.member_name.toLowerCase().includes(unpaidSearch.toLowerCase()) || 
                          u.member_number.toLowerCase().includes(unpaidSearch.toLowerCase());
    const matchesDojang = filterDojang ? u.dojang === filterDojang : true;
    
    // Filter by target month & year if specified
    let matchesUnpaidPeriod = true;
    if (filterMonth && filterYear) {
      matchesUnpaidPeriod = u.unpaid_months.some(m => 
        parseInt(m.month) === parseInt(filterMonth) && 
        parseInt(m.year) === parseInt(filterYear)
      );
    } else if (filterYear) {
      matchesUnpaidPeriod = u.unpaid_months.some(m => 
        parseInt(m.year) === parseInt(filterYear)
      );
    } else if (filterMonth) {
      matchesUnpaidPeriod = u.unpaid_months.some(m => 
        parseInt(m.month) === parseInt(filterMonth)
      );
    }

    return matchesSearch && matchesDojang && matchesUnpaidPeriod;
  });

  const handlePrintReceipt = (receipt) => {
    if (!receipt) return;
    const printWindow = window.open('', '_blank');
    const systemName = settings?.app_name || 'Taekwondo Club Management';
    const dojangName = settings?.dojang_name || 'Dojang Taekwondo';
    printWindow.document.write(`
      <html>
        <head>
          <title>Kuitansi Iuran - TX-${receipt.id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; }
            .receipt-box { max-width: 450px; margin: 0 auto; border: 1px dashed #cbd5e1; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .header h2 { margin: 0; color: #0f172a; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
            .header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; }
            .header .dojang { font-size: 11px; color: #2563eb; font-weight: 700; margin-top: 2px; }
            .flex-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #f1f5f9; padding: 10px 0; font-size: 13px; }
            .flex-row span { color: #64748b; }
            .flex-row strong { color: #0f172a; }
            .total-row { display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-top: 16px; font-weight: 700; font-size: 15px; }
            .total-row span { color: #2563eb; }
            .total-row strong { color: #1d4ed8; font-size: 16px; }
            .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>KUITANSI RESMI</h2>
              <p>${systemName}</p>
              <div class="dojang">${dojangName}</div>
            </div>
            <div class="flex-row"><span>No. Transaksi:</span><strong>#TX-${receipt.id}</strong></div>
            <div class="flex-row"><span>Nama Anggota:</span><strong>${receipt.member_name}</strong></div>
            <div class="flex-row"><span>No. Anggota:</span><strong>${receipt.member_number || '-'}</strong></div>
            <div class="flex-row"><span>Periode Iuran:</span><strong>${getMonthName(receipt.month)} ${receipt.year}</strong></div>
            <div class="flex-row"><span>Metode Bayar:</span><strong style="text-transform: uppercase;">${receipt.method}</strong></div>
            <div class="flex-row"><span>Tanggal Bayar:</span><strong>${new Date(receipt.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
            
            <div class="total-row">
              <span>TOTAL BAYAR</span>
              <strong>Rp ${parseFloat(receipt.amount).toLocaleString()}</strong>
            </div>
            
            <div class="footer">
              <p>${systemName} - Bukti Pembayaran Sah</p>
              <p style="font-size: 9px; margin-top: 4px;">Dicetak otomatis oleh sistem manajemen dojang</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kelola Pembayaran Iuran</h2>
          <p className="text-xs text-slate-500">
            {activeTab === 'list'
              ? 'Daftar riwayat penerimaan pembayaran iuran bulanan anggota'
              : 'Daftar tagihan bulanan anggota yang belum terlunasi'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} /> Catat Pembayaran
        </button>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('list'); setPage(1); }}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all ${activeTab === 'list'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Riwayat Pembayaran
        </button>
        <button
          onClick={() => { setActiveTab('unpaid'); setPage(1); }}
          className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'unpaid'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
        >
          Tagihan & Penagihan
          {/* {unpaidDues.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-650 text-white font-bold animate-pulse">
              {unpaidDues.length}
            </span>
          )} */}
        </button>
      </div>

      {activeTab === 'list' ? (
        <>
          {/* Filter and Search for history list */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center shadow-sm">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Cari nama anggota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs placeholder:text-slate-450 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
              {/* Dojang Filter */}
              <select
                value={filterDojang}
                onChange={(e) => {
                  setFilterDojang(e.target.value);
                  setPage(1);
                }}
                className="flex-1 md:flex-initial min-w-[120px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
              >
                <option value="">Semua Dojang</option>
                {dojangsList.map(dj => (
                  <option key={dj} value={dj}>{dj}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilterStatus(val);
                  setPage(1);
                  if (val === 'belum_bayar' && !filterMonth) {
                    setFilterMonth(String(new Date().getMonth() + 1));
                  }
                }}
                className="flex-1 md:flex-initial min-w-[125px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
              >
                <option value="">Status: Semua</option>
                <option value="sudah_bayar">Sudah Bayar</option>
                <option value="belum_bayar">Belum Bayar</option>
              </select>

              <select
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setPage(1);
                }}
                className="flex-1 md:flex-initial min-w-[110px] px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
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

              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-16 flex-1 md:flex-initial px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
                placeholder="Tahun"
              />

              <button
                onClick={downloadDuesExcel}
                className="flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
                title="Download Excel"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={downloadDuesPdf}
                className="flex-1 md:flex-initial px-3 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
                title="Download PDF"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
          </div>

          {/* Dues History Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : dues.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Tidak ada data pembayaran iuran ditemukan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="p-4">Anggota</th>
                      <th className="p-4">Iuran Bulan</th>
                      <th className="p-4">Tanggal Bayar</th>
                      <th className="p-4">Nominal</th>
                      <th className="p-4">Metode</th>
                      <th className="p-4 text-center">Bukti / Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dues.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                          {d.member_name}
                        </td>
                        <td className="p-4 text-slate-650 font-medium whitespace-nowrap">
                          {getMonthName(d.month)} {d.year}
                        </td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">
                          {d.payment_date !== '-' 
                            ? new Date(d.payment_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '-'
                          }
                        </td>
                        <td className="p-4 text-slate-800 font-semibold whitespace-nowrap">
                          Rp {parseFloat(d.amount).toLocaleString()}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded uppercase text-[10px] font-bold ${d.status === 'belum_bayar' ? 'bg-red-50 border border-red-100 text-red-650' : 'bg-blue-50 border border-blue-100 text-blue-700'}`}>
                            {d.status === 'belum_bayar' ? 'Belum Bayar' : d.method}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            {d.status === 'belum_bayar' ? (
                              <button
                                onClick={() => handlePayUnpaid({
                                  member_id: d.member_id,
                                  member_name: d.member_name,
                                  member_number: d.member_number,
                                  unpaid_months: [{ month: parseInt(d.month), year: parseInt(d.year) }]
                                })}
                                className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] transition-all shadow-sm"
                              >
                                Bayar / Lunasi
                              </button>
                            ) : (
                              <>
                                {d.attachment && (
                                  <a
                                    href={d.attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-semibold transition-colors"
                                  >
                                    Lihat Bukti
                                  </a>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedReceipt(d);
                                    setIsReceiptOpen(true);
                                  }}
                                  className="p-1.5 rounded bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors inline-flex items-center gap-1 text-[10px] font-medium"
                                  title="Print Receipt"
                                >
                                  <Printer size={13} /> Kuitansi
                                </button>
                                <button
                                  onClick={() => startEditDue(d)}
                                  className="p-1.5 rounded bg-white hover:bg-slate-50 text-slate-655 border border-slate-200 hover:text-blue-600 transition-colors"
                                  title="Edit"
                                >
                                  <Edit size={13} />
                                </button>
                                <button
                                  onClick={() => handleDueDelete(d.id)}
                                  className="p-1.5 rounded bg-white hover:bg-slate-50 text-slate-655 border border-slate-200 hover:text-red-600 transition-colors"
                                  title="Hapus"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
        </>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center shadow-sm">
            <div className="flex flex-col md:flex-wrap lg:flex-row gap-2.5 w-full md:w-auto items-stretch md:items-center">
              <div className="relative w-full md:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Cari nama anggota belum bayar..."
                  value={unpaidSearch}
                  onChange={(e) => setUnpaidSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-850 text-xs placeholder:text-slate-455 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filterDojang}
                onChange={(e) => setFilterDojang(e.target.value)}
                className="w-full md:w-auto px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
              >
                <option value="">Semua Dojang</option>
                {dojangsList.map(dj => (
                  <option key={dj} value={dj}>{dj}</option>
                ))}
              </select>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full md:w-auto px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
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

              <input
                type="number"
                value={filterYear}
                onChange={(e) => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())}
                className="w-full md:w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-655 focus:outline-none"
                placeholder="Tahun"
              />

              <button
                onClick={downloadUnpaidExcel}
                className="w-full md:w-auto px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-emerald-600/10"
                title="Download Excel"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button
                onClick={downloadUnpaidPdf}
                className="w-full md:w-auto px-3 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-red-600/20"
                title="Download PDF"
              >
                <FileText size={13} /> PDF
              </button>
            </div>
            <div className="text-slate-600 text-xs flex items-center justify-start md:justify-end gap-1.5">
              <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0" />
              <span>Default Iuran: <strong className="text-slate-800">Rp {parseFloat(settings?.default_dues_amount || 85000).toLocaleString()} / bulan</strong></span>
            </div>
          </div>

          {/* Unpaid Bills Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
            {isUnpaidLoading ? (
              <div className="p-12 text-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : filteredUnpaidDues.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                Tidak ada tunggakan iuran anggota ditemukan
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <th className="p-4" style={{ width: '50px' }}>No</th>
                      <th className="p-4">Anggota</th>
                      <th className="p-4">Bulan Belum Dibayar</th>
                      <th className="p-4 text-center">Jumlah Tunggakan</th>
                      <th className="p-4 text-right">Total Tagihan</th>
                      <th className="p-4 text-center">Aksi Penagihan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnpaidDues.map((u, idx) => (
                      <tr key={u.member_id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-500 font-semibold">{idx + 1}</td>
                        <td className="p-4 font-semibold text-slate-800 whitespace-nowrap">
                          {u.member_name}
                        </td>
                        <td className="p-4 text-slate-650">
                          <div className="flex flex-wrap gap-1 min-w-[180px]">
                            {(() => {
                              const renderedMonths = u.unpaid_months.filter(m => {
                                const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                                const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                                return matchesM && matchesY;
                              });
                              return (
                                <>
                                  {renderedMonths.slice(0, 5).map((m, i) => (
                                    <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-red-50 border border-red-100 text-red-600 font-semibold whitespace-nowrap">
                                      {getMonthName(m.month)} {m.year}
                                    </span>
                                  ))}
                                  {renderedMonths.length > 5 && (
                                    <span className="px-2 py-0.5 text-[10px] rounded bg-slate-100 border border-slate-200 text-slate-500 font-bold whitespace-nowrap">
                                      +{renderedMonths.length - 5} bulan lagi
                                    </span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-red-600 whitespace-nowrap">
                          {(() => {
                            const filteredMonths = u.unpaid_months.filter(m => {
                              const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                              const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                              return matchesM && matchesY;
                            });
                            return `${filteredMonths.length} Bulan`;
                          })()}
                        </td>
                        <td className="p-4 text-right font-bold text-slate-800 whitespace-nowrap">
                          {(() => {
                            const filteredMonths = u.unpaid_months.filter(m => {
                              const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                              const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                              return matchesM && matchesY;
                            });
                            const defaultDuesRate = parseFloat(settings?.default_dues_amount) || 85000;
                            return `Rp ${(filteredMonths.length * defaultDuesRate).toLocaleString()}`;
                          })()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                const filteredMonths = u.unpaid_months.filter(m => {
                                  const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                                  const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                                  return matchesM && matchesY;
                                });
                                printInvoice({
                                  ...u,
                                  unpaid_months: filteredMonths,
                                  total_unpaid: filteredMonths.length,
                                  total_bill: filteredMonths.length * (parseFloat(settings?.default_dues_amount) || 85000)
                                });
                              }}
                              className="px-2.5 py-1.5 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Printer size={13} /> Cetak Invoice
                            </button>
                            <button
                              onClick={() => {
                                const filteredMonths = u.unpaid_months.filter(m => {
                                  const matchesM = filterMonth ? parseInt(m.month) === parseInt(filterMonth) : true;
                                  const matchesY = filterYear ? parseInt(m.year) === parseInt(filterYear) : true;
                                  return matchesM && matchesY;
                                });
                                handlePayUnpaid({
                                  ...u,
                                  unpaid_months: filteredMonths
                                });
                              }}
                              className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] transition-all shadow-sm"
                            >
                              Bayar / Lunasi
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
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDue(null);
          resetForm();
        }}
        title={editingDue ? "Edit Transaksi Iuran" : "Catat Pembayaran Iuran"}
      >
        <form onSubmit={handlePaySubmit} className="space-y-6 text-xs text-slate-650">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Pilih Anggota */}
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-600 block mb-1">Pilih Anggota *</label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadMembersOptions}
                value={paymentForm.member_id ? {
                  value: paymentForm.member_id,
                  label: members.find(m => m.id === parseInt(paymentForm.member_id))?.name || 'Anggota Terpilih'
                } : null}
                onChange={(val) => setPaymentForm(prev => ({ ...prev, member_id: val ? val.value : '' }))}
                styles={reactSelectCustomStyles}
                placeholder="Ketik nama anggota untuk mencari..."
                noOptionsMessage={() => "Anggota tidak ditemukan"}
                loadingMessage={() => "Mencari..."}
                required
              />
            </div>

            {/* Tahun */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Tahun *</label>
              <input
                type="number"
                value={paymentForm.year}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Metode Bayar *</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="cash">Cash / Tunai</option>
                <option value="transfer">Bank Transfer</option>
                <option value="qris">QRIS Digital</option>
              </select>
            </div>
          </div>

          {/* Bulan Checklists or Dropdown */}
          {editingDue ? (
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Bulan Pembayaran *</label>
              <select
                value={paymentForm.months[0] || ''}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, months: [parseInt(e.target.value)] }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <option key={m} value={m}>{getMonthName(m)}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-600 block">Pilih Bulan Pembayaran *</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                  <label
                    key={m}
                    className={`py-2 px-1 rounded-lg border text-center font-medium block cursor-pointer transition-all ${paymentForm.months.includes(m)
                        ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={paymentForm.months.includes(m)}
                      onChange={() => handleMonthToggle(m)}
                      className="hidden"
                    />
                    <span>{getMonthName(m)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Nominal Bayar */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Total Nominal Pembayaran (Rp) *</label>
            <input
              type="number"
              placeholder="Total pembayaran otomatis terisi"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Status Pembayaran (Only when editing) */}
          {editingDue && (
            <div className="space-y-1">
              <label className="font-semibold text-slate-600 block">Status Pembayaran *</label>
              <select
                value={paymentForm.status}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
                required
              >
                <option value="sudah_bayar">Sudah Bayar</option>
                <option value="belum_bayar">Belum Bayar</option>
                <option value="menunggak">Menunggak</option>
              </select>
            </div>
          )}

          {/* Upload attachment */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Bukti Bayar / Slip Transfer (Optional)</label>
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files[0])}
              className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-slate-200 file:text-xs file:bg-white file:text-slate-700 file:cursor-pointer hover:file:bg-slate-50"
            />
          </div>

          {/* Catatan */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-600 block">Keterangan</label>
            <textarea
              rows="2"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingDue(null);
                resetForm();
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md"
            >
              {isLoading ? 'Menyimpan...' : (editingDue ? 'Simpan Perubahan' : 'Bayar Sekarang')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Print Receipt Modal */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Bukti Kuitansi Pembayaran">
        {selectedReceipt && (
          <div className="space-y-6 text-xs text-slate-700 p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-800">KUITANSI RESMI</h3>
              <p className="text-slate-500 uppercase tracking-widest text-[10px]">{settings?.app_name || 'Taekwondo Club Management'}</p>
              {settings?.dojang_name && (
                <p className="text-blue-600 font-bold text-[9px] uppercase tracking-wider">{settings.dojang_name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-y-2 border-t border-b border-slate-200 py-4">
              <span className="text-slate-550">No. Transaksi</span>
              <span className="text-slate-800 font-semibold text-right">#TX-{selectedReceipt.id}</span>

              <span className="text-slate-550">Nama Anggota</span>
              <span className="text-slate-800 font-semibold text-right">{selectedReceipt.member_name}</span>

              <span className="text-slate-550">No. Anggota</span>
              <span className="text-slate-800 text-right">{selectedReceipt.member_number || '-'}</span>

              <span className="text-slate-550">Pembayaran Iuran</span>
              <span className="text-slate-800 font-medium text-right">{getMonthName(selectedReceipt.month)} {selectedReceipt.year}</span>

              <span className="text-slate-550">Metode Bayar</span>
              <span className="text-slate-800 uppercase text-right">{selectedReceipt.method}</span>

              <span className="text-slate-550">Tanggal / Waktu</span>
              <span className="text-slate-800 text-right">{new Date(selectedReceipt.payment_date).toLocaleDateString('id-ID')}</span>
            </div>

            <div className="flex justify-between items-center bg-blue-50 border border-blue-100 p-3 rounded-lg">
              <span className="font-semibold text-blue-600 font-bold">TOTAL BAYAR</span>
              <span className="font-bold text-blue-700 text-sm">Rp {parseFloat(selectedReceipt.amount).toLocaleString()}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedReceipt)}
                className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center gap-1.5 font-semibold text-xs transition-colors"
              >
                <Printer size={14} /> Cetak Kuitansi
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceipt(selectedReceipt)}
                className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-1.5 font-semibold text-xs shadow-md transition-colors"
              >
                <FileText size={14} /> Download PDF
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
