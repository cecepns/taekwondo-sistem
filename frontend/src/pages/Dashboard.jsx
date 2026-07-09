import React, { useEffect, useState } from 'react';
import { request } from '../utils/request';
import { API_ENDPOINTS } from '../utils/endpoints';
import {
  Users, UserCheck, BadgeCent, Award, ArrowUpRight, ShieldCheck, Calendar
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const INITIAL_STATS = {
  totalMembers: 0,
  activeMembers: 0,
  inactiveMembers: 0,
  lulusMembers: 0,
  keluarMembers: 0,
  totalCoaches: 0,
  activeCoaches: 0,
  totalChampionships: 0,
  totalDuesPaid: 0,
  totalDuesUnpaid: 0,
  monthlyDues: Array(12).fill(0),
  memberStatusCounts: [0, 0, 0, 0],
  attendanceThisMonth: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await request.get(API_ENDPOINTS.DASHBOARD.STATS);
        if (res.success) {
          setStats({ ...INITIAL_STATS, ...res.data });
        } else {
          setError('Gagal memuat data dashboard');
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
        setError('Gagal terhubung ke server');
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  // Chart datasets — derived from a single API response
  const duesChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
    datasets: [
      {
        label: 'Iuran Terkumpul (Rp)',
        data: stats.monthlyDues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointRadius: 4,
      }
    ]
  };

  const memberStatusData = {
    labels: ['Aktif', 'Tidak Aktif', 'Lulus', 'Keluar'],
    datasets: [
      {
        data: stats.memberStatusCounts,
        backgroundColor: [
          'rgba(34, 197, 94, 0.75)',
          'rgba(239, 68, 68, 0.75)',
          'rgba(168, 85, 247, 0.75)',
          'rgba(100, 116, 139, 0.75)'
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  };

  const activeRatio = stats.totalMembers > 0
    ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        <p className="text-slate-500 text-sm">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <p className="text-red-400 font-semibold">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-24 -translate-y-24" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-20" />
        <div className="relative z-10 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Selamat Datang di Taekwondo Management
          </h2>
          <p className="text-blue-100/80 text-sm mt-2 leading-relaxed">
            Kelola data registrasi anggota, administrasi iuran, jadwal latihan, tes fisik siswa, dan pelaporan championship dalam satu platform.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">

        <StatCard
          label="Total Anggota"
          value={stats.totalMembers}
          sub={<span className="text-green-400 flex items-center gap-1"><ArrowUpRight size={12} /> Aktif {activeRatio}%</span>}
          icon={<Users size={20} />}
          color="blue"
        />

        <StatCard
          label="Anggota Aktif"
          value={stats.activeMembers}
          sub={`Non-aktif: ${stats.inactiveMembers}`}
          icon={<UserCheck size={20} />}
          color="green"
        />

        <StatCard
          label="Total Pelatih"
          value={stats.totalCoaches}
          sub={`Aktif: ${stats.activeCoaches}`}
          icon={<ShieldCheck size={20} />}
          color="orange"
        />

        <StatCard
          label="Iuran Terkumpul"
          value={`Rp ${stats.totalDuesPaid.toLocaleString('id-ID')}`}
          valueSm
          sub={<span className="text-red-400">Tunggakan: Rp {stats.totalDuesUnpaid.toLocaleString('id-ID')}</span>}
          icon={<BadgeCent size={20} />}
          color="yellow"
        />

        <StatCard
          label="Championship"
          value={stats.totalChampionships}
          sub="Internal & Regional"
          icon={<Award size={20} />}
          color="purple"
        />
      </div>

      {/* Absensi bulan ini — highlight card */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex items-center gap-5">
        <div className="p-4 bg-teal-600/10 border border-teal-500/20 text-teal-400 rounded-xl">
          <Calendar size={26} />
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Absensi Bulan Ini</p>
          <h3 className="text-3xl font-bold text-white mt-0.5">{stats.attendanceThisMonth}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Total kehadiran anggota pada bulan berjalan</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Dues Line Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-semibold text-slate-200">Grafik Pemasukan Iuran</h4>
              <p className="text-xs text-slate-500 mt-0.5">Akumulasi iuran terkumpul per bulan</p>
            </div>
            <span className="text-xs !text-white bg-slate-800 px-2.5 py-1 rounded-lg">
              {new Date().getFullYear()}
            </span>
          </div>
          <div className="h-72">
            <Line
              data={duesChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: {
                      color: '#64748b',
                      callback: (v) => `Rp ${(v / 1000).toFixed(0)}k`
                    }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { color: '#64748b' }
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` Rp ${ctx.parsed.y.toLocaleString('id-ID')}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Member Status Donut */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="mb-6">
            <h4 className="font-semibold text-slate-200">Status Anggota</h4>
            <p className="text-xs text-slate-500 mt-0.5">Breakdown status keanggotaan</p>
          </div>
          <div className="h-52 flex items-center justify-center">
            <Doughnut
              data={memberStatusData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#94a3b8',
                      boxWidth: 10,
                      font: { size: 11 },
                      padding: 12
                    }
                  }
                }
              }}
            />
          </div>
          {/* Summary below donut */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { label: 'Aktif', count: stats.activeMembers, color: 'bg-green-500' },
              { label: 'Tidak Aktif', count: stats.inactiveMembers, color: 'bg-red-500' },
              { label: 'Lulus', count: stats.lulusMembers, color: 'bg-purple-500' },
              { label: 'Keluar', count: stats.keluarMembers, color: 'bg-slate-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                {item.label}: <span className="text-slate-200 font-semibold ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable stat card component
function StatCard({ label, value, sub, icon, color, valueSm }) {
  const colorMap = {
    blue: { bg: 'bg-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400' },
    green: { bg: 'bg-green-600/10', border: 'border-green-500/20', text: 'text-green-400' },
    orange: { bg: 'bg-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400' },
    yellow: { bg: 'bg-yellow-600/10', border: 'border-yellow-500/20', text: 'text-yellow-400' },
    purple: { bg: 'bg-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <span className="text-slate-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider block">{label}</span>
        <h3 className={`font-bold text-white truncate ${valueSm ? 'text-base sm:text-lg' : 'text-2xl'}`}>{value}</h3>
        <div className="text-[10px] sm:text-xs text-slate-400">{sub}</div>
      </div>
      <div className={`p-2.5 sm:p-3 ${c.bg} border ${c.border} ${c.text} rounded-xl flex-shrink-0`}>
        {icon}
      </div>
    </div>
  );
}
