import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import { 
  User, Calendar, Shield, Weight, Ruler, Droplet, Phone, 
  MapPin, Clock, BadgeCent, Award, ClipboardCheck, ArrowLeft, ArrowUpRight, ArrowDownRight, HelpCircle
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

export default function MemberDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [duesHistory, setDuesHistory] = useState([]);
  const [physicalHistory, setPhysicalHistory] = useState([]);
  const [championships, setChampionships] = useState([]);
  const [attendances, setAttendances] = useState([]);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const memberRes = await request.get(API_ENDPOINTS.MEMBERS.DETAIL(id));
        if (memberRes.success) setMember(memberRes.data);

        // Fetch Dues History
        const duesRes = await request.get(API_ENDPOINTS.DUES.LIST);
        if (duesRes.success) {
          const filtered = (duesRes.data || []).filter(d => d.member_id === parseInt(id));
          setDuesHistory(filtered);
        }

        // Fetch Physical Results
        const physicalRes = await request.get(API_ENDPOINTS.PHYSICAL_TESTS.RESULTS_LIST);
        if (physicalRes.success) {
          const filtered = (physicalRes.data || []).filter(r => r.member_id === parseInt(id));
          setPhysicalHistory(filtered);
        }

        // Fetch Championships
        const champRes = await request.get(API_ENDPOINTS.CHAMPIONSHIPS.PARTICIPANTS_LIST);
        if (champRes.success) {
          const filtered = (champRes.data || []).filter(p => p.member_id === parseInt(id));
          setChampionships(filtered);
        }

        // Fetch Member Attendances
        const attRes = await request.get(API_ENDPOINTS.ATTENDANCE.MEMBER_LIST);
        if (attRes.success) {
          const filtered = (attRes.data || []).filter(a => a.member_id === parseInt(id));
          setAttendances(filtered);
        }
      } catch (err) {
        console.error('Failed to load member profile details', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12 text-slate-400 space-y-4">
        <HelpCircle size={48} className="mx-auto text-slate-600" />
        <p>Data anggota tidak ditemukan.</p>
        <Link to="/members" className="text-blue-500 hover:underline">Kembali ke Daftar Anggota</Link>
      </div>
    );
  }

  // Calculate age automatically
  const birthYear = new Date(member.birth_date).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Prepare Physical Progress Chart
  // Group results by date
  const speedResults = physicalHistory.filter(r => r.test_type_id === 1).sort((a, b) => new Date(a.date) - new Date(b.date));
  const chartData = {
    labels: speedResults.map(r => new Date(r.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Sprint Speed (detik)',
        data: speedResults.map(r => parseFloat(r.result_value)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.2,
        fill: true
      }
    ]
  };

  const tabs = [
    { id: 'profile', name: 'Profile Lengkap', icon: User },
    { id: 'dues', name: 'Riwayat Iuran', icon: BadgeCent },
    { id: 'physical', name: 'Hasil Tes Fisik', icon: ClipboardCheck },
    { id: 'championship', name: 'Kejuaraan', icon: Award },
    { id: 'attendance', name: 'Kehadiran', icon: Clock }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link to="/members" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={14} /> Kembali ke Daftar
        </Link>
      </div>

      {/* Hero card header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-xl">
        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <User size={36} className="text-slate-600" />
          )}
        </div>

        <div className="text-center md:text-left flex-1 space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">{member.name}</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold uppercase">{member.member_number}</span>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1.5 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Shield size={13} className="text-slate-500" /> Sabuk {member.belt_name}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar size={13} className="text-slate-500" /> Usian {age} Tahun</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock size={13} className="text-slate-500" /> Bergabung {new Date(member.joined_date).toLocaleDateString('id-ID')}</span>
          </div>

          <div className="pt-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              member.status === 'aktif' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-700/30 text-slate-400 border border-slate-700/40'
            }`}>{member.status}</span>
          </div>
        </div>
      </div>

      {/* Tabs navigation bar */}
      <div className="border-b border-slate-800 flex overflow-x-auto gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 font-semibold text-xs flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-xl min-h-[300px]">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Informasi Diri</h3>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-400">Tempat/Tgl Lahir</span>
                <span className="col-span-2 text-slate-200">{member.birth_place}, {new Date(member.birth_date).toLocaleDateString('id-ID')}</span>
                
                <span className="text-slate-400">Jenis Kelamin</span>
                <span className="col-span-2 text-slate-200">{member.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>

                <span className="text-slate-400">Golongan Darah</span>
                <span className="col-span-2 text-slate-200">{member.blood_type}</span>

                <span className="text-slate-400">Sekolah</span>
                <span className="col-span-2 text-slate-200">{member.school || '-'}</span>

                <span className="text-slate-400">Alamat</span>
                <span className="col-span-2 text-slate-200 leading-relaxed">{member.address || '-'}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Fisik & Kontak Orang Tua</h3>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-slate-400">Nama Wali / Ortu</span>
                <span className="col-span-2 text-slate-200">{member.parent_name || '-'}</span>

                <span className="text-slate-400">Nomor WhatsApp</span>
                <span className="col-span-2 text-slate-200">{member.whatsapp || '-'}</span>

                <span className="text-slate-400">Berat Badan</span>
                <span className="col-span-2 text-slate-200">{member.weight ? `${member.weight} kg` : '-'}</span>

                <span className="text-slate-400">Tinggi Badan</span>
                <span className="col-span-2 text-slate-200">{member.height ? `${member.height} cm` : '-'}</span>

                <span className="text-slate-400">Catatan/Alergi</span>
                <span className="col-span-2 text-slate-200 leading-relaxed">{member.notes || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dues' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Catatan Pembayaran Dues</h3>
            {duesHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat pembayaran iuran.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-2">Bulan/Tahun</th>
                      <th className="py-3 px-2">Tanggal Bayar</th>
                      <th className="py-3 px-2">Nominal</th>
                      <th className="py-3 px-2">Metode</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {duesHistory.map(d => (
                      <tr key={d.id} className="hover:bg-slate-800/20">
                        <td className="py-3 px-2 font-medium">Bulan {d.month} / {d.year}</td>
                        <td className="py-3 px-2 text-slate-400">{new Date(d.payment_date).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 px-2 text-slate-200">Rp {parseFloat(d.amount).toLocaleString()}</td>
                        <td className="py-3 px-2 uppercase text-slate-400">{d.method}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded text-[10px] text-green-400 font-bold uppercase">Lunas</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'physical' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Riwayat Uji Fisik</h3>
              {physicalHistory.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat hasil tes fisik.</p>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {physicalHistory.map(r => (
                    <div key={r.id} className="p-3 bg-slate-950/30 border border-slate-800 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-200">{r.test_name}</div>
                        <div className="text-[10px] text-slate-500">{new Date(r.date).toLocaleDateString('id-ID')}</div>
                        <div className="text-slate-400 leading-relaxed">{r.evaluation}</div>
                      </div>
                      <div className="text-right space-y-1.5 flex-shrink-0">
                        <div className="font-bold text-blue-400 text-sm">{r.result_value}</div>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase inline-flex items-center gap-0.5 ${
                          r.status === 'naik' ? 'bg-green-500/10 text-green-400' :
                          r.status === 'turun' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/30 text-slate-400'
                        }`}>
                          {r.status === 'naik' && <ArrowUpRight size={10} />}
                          {r.status === 'turun' && <ArrowDownRight size={10} />}
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Progression Chart */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Perkembangan Latihan (Sprint 30m)</h3>
              {speedResults.length > 0 ? (
                <div className="h-60">
                  <Line 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      scales: {
                        y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                        x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                      }
                    }} 
                  />
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-650 text-xs">
                  Dibutuhkan minimal 2 tes lari sprint untuk menghasilkan grafik.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'championship' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Prestasi & Kejuaraan</h3>
            {championships.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum pernah berpartisipasi dalam turnamen.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {championships.map(c => (
                  <div key={c.id} className="p-4 bg-slate-950/20 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-200">{c.championship_name}</div>
                      <div className="text-[10px] text-slate-500">Kategori: {c.category}</div>
                      <div className="text-slate-400">Target Medali: {c.target_medal}</div>
                    </div>
                    {c.medal && c.medal !== 'none' && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 ${
                        c.medal === 'emas' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                        c.medal === 'perak' ? 'bg-slate-300/10 text-slate-200 border border-slate-300/20' :
                        'bg-amber-600/10 text-amber-500 border border-amber-600/20'
                      }`}>
                        🏆 {c.medal}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">Riwayat Presensi Latihan</h3>
            {attendances.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">Belum ada riwayat kehadiran tercatat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-2">Tanggal Latihan</th>
                      <th className="py-3 px-2">Kategori Kelas</th>
                      <th className="py-3 px-2">Status Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {attendances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/20">
                        <td className="py-3 px-2 text-slate-300">{new Date(a.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-3 px-2 text-slate-450">{a.class_name || 'Reguler'}</td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            a.status === 'hadir' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            a.status === 'izin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            a.status === 'sakit' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
