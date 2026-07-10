const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_taekwondo_tms_jwt_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Create upload directory
const UPLOAD_DIR = path.join(__dirname, 'uploads-taekwondo-tms');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ========================================================
// HYBRID DATABASE SETUP (MySQL with In-Memory Fallback)
// ========================================================
let pool = null;
let useMemoryDb = false;

// Mock database initial state matching seed data
const memoryDb = {
  app_settings: [
    {
      id: 1,
      app_name: 'Taekwondo Club Management',
      dojang_name: 'Dojang Taekwondo Indonesia',
      address: 'Jl. Sudirman No. 45, Jakarta Selatan',
      whatsapp: '081234567890',
      email: 'dojang@taekwondo.id',
      logo: '',
      favicon: '',
      login_bg: '',
      dashboard_bg: '',
      dashboard_banner: '',
      main_color: '#3b82f6',
      footer_text: '© 2026 Taekwondo Management System. All Rights Reserved.',
      default_dues_amount: 85000.00
    }
  ],
  users: [
    { id: 1, username: 'superadmin', password_hash: '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', name: 'Super Admin TMS', role: 'super_admin', status: 'aktif' },
    { id: 2, username: 'admin', password_hash: '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', name: 'Admin Dojang', role: 'admin', status: 'aktif' },
    { id: 3, username: 'keuangan', password_hash: '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', name: 'Staff Keuangan', role: 'finance', status: 'aktif' }
  ],
  belts: [
    { id: 1, name: 'Putih', color: 'white', order_index: 1 },
    { id: 2, name: 'Kuning', color: 'yellow', order_index: 2 },
    { id: 3, name: 'Kuning Strip Hijau', color: 'yellow-green', order_index: 3 },
    { id: 4, name: 'Hijau', color: 'green', order_index: 4 },
    { id: 5, name: 'Hijau Strip Biru', color: 'green-blue', order_index: 5 },
    { id: 6, name: 'Biru', color: 'blue', order_index: 6 },
    { id: 7, name: 'Biru Strip Merah', color: 'blue-red', order_index: 7 },
    { id: 8, name: 'Merah', color: 'red', order_index: 8 },
    { id: 9, name: 'Merah Strip Hitam 1', color: 'red-black1', order_index: 9 },
    { id: 10, name: 'Merah Strip Hitam 2', color: 'red-black2', order_index: 10 },
    { id: 11, name: 'Hitam (DAN 1)', color: 'black1', order_index: 11 },
    { id: 12, name: 'Hitam (DAN 2)', color: 'black2', order_index: 12 }
  ],
  classes: [
    { id: 1, name: 'Pemula', description: 'Kelas untuk anggota ber-sabuk Putih s/d Kuning Strip' },
    { id: 2, name: 'Pra Cadet', description: 'Kelas untuk anggota usia di bawah 11 tahun' },
    { id: 3, name: 'Cadet', description: 'Kelas untuk anggota usia 12-14 tahun' },
    { id: 4, name: 'Junior', description: 'Kelas untuk anggota usia 15-17 tahun' },
    { id: 5, name: 'Senior', description: 'Kelas untuk anggota usia 18 tahun ke atas' },
    { id: 6, name: 'Prestasi', description: 'Kelas khusus persiapan kejuaraan dan pemusatan latihan' }
  ],
  members: [
    { id: 1, member_number: 'TMS-2026-0001', name: 'Fauzan Ahmad', photo: '', gender: 'L', birth_place: 'Jakarta', birth_date: '2012-05-15', parent_name: 'Heri Ahmad', whatsapp: '081299998888', school: 'SDN 01 Pagi Jakarta', belt_id: 1, weight: 32.50, height: 135.00, blood_type: 'O', address: 'Jl. Merdeka No. 10', status: 'aktif', joined_date: '2026-01-10', notes: '', doc_akta: '', doc_kk: '', doc_photo: '' },
    { id: 2, member_number: 'TMS-2026-0002', name: 'Siti Aminah', photo: '', gender: 'P', birth_place: 'Bandung', birth_date: '2010-09-20', parent_name: 'Rudi Aminah', whatsapp: '081288887777', school: 'SMPN 12 Jakarta', belt_id: 4, weight: 42.00, height: 150.00, blood_type: 'A', address: 'Jl. Proklamasi No. 5', status: 'aktif', joined_date: '2026-01-15', notes: '', doc_akta: '', doc_kk: '', doc_photo: '' }
  ],
  member_classes: [
    { member_id: 1, class_id: 2 },
    { member_id: 2, class_id: 3 }
  ],
  coaches: [
    { id: 1, name: 'Sabeum Nim Budi', photo: '', whatsapp: '081234567891', address: 'Jl. Mawar No. 12, Jakarta', base_honor: 150000.00, status: 'aktif' },
    { id: 2, name: 'Sabeum Nim Andi', photo: '', whatsapp: '081234567892', address: 'Jl. Melati No. 23, Jakarta', base_honor: 200000.00, status: 'aktif' }
  ],
  coach_attendances: [],
  member_attendances: [],
  dues: [],
  training_sessions: [],
  training_session_items: [],
  training_programs: [
    { id: 1, name: 'Latihan Tendangan (Kicking)', category: 'Tendangan', description: 'Fokus pada teknik tendangan dasar dan cepat seperti Ap Chagi, Dollyo Chagi, dan Dwi Chagi.', target: 'Kecepatan dan presisi tendangan', duration: '60 menit', image: '', video: '', is_active: 1 },
    { id: 2, name: 'Poomsae Taegeuk 1-3', category: 'Poomsae', description: 'Latihan jurus dasar Taegeuk Il Jang, Ee Jang, dan Sam Jang.', target: 'Akurasi gerakan dan kekuatan kuda-kuda', duration: '45 menit', is_active: 1 },
    { id: 3, name: 'Latihan Kelincahan Kaki (Footwork)', category: 'Kecepatan', description: 'Latihan footwork sparring menggunakan ladder drill and cone.', target: 'Kelincahan bergerak saat sparring', duration: '30 menit', is_active: 1 },
    { id: 4, name: 'Cardio & Endurance Circuit', category: 'Stamina', description: 'Latihan sirkuit fisik: pushup, situp, jumping jack, shuttle run.', target: 'Daya tahan fisik bertanding', duration: '45 menit', is_active: 1 }
  ],
  schedules: [],
  championships: [
    { id: 1, name: 'Kejuaraan Nasional Taekwondo Indonesia 2026', location: 'Istora Senayan, Jakarta', date: '2026-08-10', organizer: 'PBTI', level: 'nasional', poster: '', description: 'Kejuaraan bergengsi tingkat nasional.' }
  ],
  championship_classes: [
    { id: 1, category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: 'Under 22kg', min_weight: 0.00, max_weight: 22.00 },
    { id: 2, category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: 'Under 24kg', min_weight: 22.01, max_weight: 24.00 },
    { id: 3, category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: 'Under 26kg', min_weight: 24.01, max_weight: 26.00 },
    { id: 4, category: 'Kyorugi', age_group: 'Pracadet A', gender: 'Semua', class_name: 'Under 28kg', min_weight: 26.01, max_weight: 28.00 },
    { id: 5, category: 'Kyorugi', age_group: 'Pracadet B', gender: 'Semua', class_name: 'Under 26kg', min_weight: 0.00, max_weight: 26.00 },
    { id: 6, category: 'Kyorugi', age_group: 'Pracadet B', gender: 'Semua', class_name: 'Under 28kg', min_weight: 26.01, max_weight: 28.00 },
    { id: 7, category: 'Kyorugi', age_group: 'Pracadet B', gender: 'Semua', class_name: 'Under 30kg', min_weight: 28.01, max_weight: 30.00 },
    { id: 8, category: 'Kyorugi', age_group: 'Pracadet B', gender: 'Semua', class_name: 'Under 33kg', min_weight: 30.01, max_weight: 33.00 },
    { id: 9, category: 'Kyorugi', age_group: 'Cadet', gender: 'L', class_name: 'Under 33kg', min_weight: 0.00, max_weight: 33.00 },
    { id: 10, category: 'Kyorugi', age_group: 'Cadet', gender: 'L', class_name: 'Under 37kg', min_weight: 33.01, max_weight: 37.00 },
    { id: 11, category: 'Kyorugi', age_group: 'Junior', gender: 'L', class_name: 'Under 45kg', min_weight: 0.00, max_weight: 45.00 }
  ],
  championship_participants: [
    { id: 1, championship_id: 1, member_id: 2, match_number: 'M-102', category: 'Kyorugi Under 45kg', class_id: 11, belt_id: 4, weight: 42.00, target_medal: 'Emas', result: 'juara_1', medal: 'emas', weigh_in_weight: null, weigh_in_status: 'unweighed' }
  ],
  physical_test_types: [
    { id: 1, name: 'Sprint 30m', category: 'Speed', description: 'Mengukur kecepatan lari jarak pendek 30 meter dalam satuan detik' },
    { id: 2, name: 'Push Up 1 Menit', category: 'Power', description: 'Mengukur kekuatan otot lengan dan dada dalam 1 menit' },
    { id: 3, name: 'Sit Up 1 Menit', category: 'Power', description: 'Mengukur kekuatan otot perut dalam 1 menit' },
    { id: 4, name: 'Vertical Jump', category: 'Power', description: 'Mengukur lompatan tegak lurus dalam satuan centimeter' },
    { id: 5, name: 'Skipping 2 Menit', category: 'Endurance', description: 'Mengukur daya tahan kardiovaskular dengan skipping dalam 2 menit' },
    { id: 6, name: 'Split Test', category: 'Flexibility', description: 'Mengukur kelenturan panggul dan kaki (rentang kaki)' }
  ],
  member_physical_targets: [
    { id: 1, member_id: 1, test_type_id: 2, target_value: '40' },
    { id: 2, member_id: 2, test_type_id: 1, target_value: '12.00' }
  ],
  physical_test_results: [
    { id: 1, member_id: 1, test_type_id: 2, date: '2026-06-01', target_value: '40', result_value: '35', score: 35.00, notes: 'Latihan lebih giat lagi', status: 'stabil', evaluation: 'Masih kurang 5 kali' }
  ],
  activity_logs: []
};

// Connect to MySQL
async function initDb() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taekwondo_tms',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    // Test connection
    const conn = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');
    
    // Add default_dues_amount to app_settings if not exists
    try {
      await conn.query('ALTER TABLE app_settings ADD COLUMN default_dues_amount DECIMAL(12,2) DEFAULT 85000.00');
      console.log('Schema migration: default_dues_amount column verified/added in app_settings.');
    } catch (e) {
      // Column may already exist
    }

    // Create training_sessions if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        program_name VARCHAR(150) NOT NULL,
        date DATE NOT NULL,
        total_duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create training_session_items if not exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS training_session_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id INT NOT NULL,
        program_id INT,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        duration INT NOT NULL DEFAULT 0,
        order_index INT DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (program_id) REFERENCES training_programs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    conn.release();
  } catch (err) {
    console.warn('MySQL connection failed. Falling back to in-memory database simulation.', err.message);
    useMemoryDb = true;
  }
}
initDb();

// Unified Database query helper
async function query(sql, params = []) {
  if (useMemoryDb) {
    return simulateQuery(sql, params);
  }
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (err) {
    console.error('SQL Error:', err);
    throw err;
  }
}

// Basic SQL simulator for Memory DB to support core app requirements without needing a live MySQL server
function simulateQuery(sql, params) {
  // Normalize whitespaces
  const queryStr = sql.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. App settings select/update
  if (queryStr.startsWith('select * from app_settings')) {
    return memoryDb.app_settings;
  }
  if (queryStr.startsWith('update app_settings')) {
    // Basic assignment parse
    const settings = memoryDb.app_settings[0];
    // Example: UPDATE app_settings SET app_name = ?, dojang_name = ... WHERE id = 1
    // For simplicity, we just apply keys passed in params or direct matching
    // In our backend server, we'll map fields explicitly so simulation is easy
    return { affectedRows: 1 };
  }

  // 2. Users CRUD
  if (queryStr.includes('from users where username =')) {
    const username = params[0];
    return memoryDb.users.filter(u => u.username === username);
  }
  if (queryStr.includes('from users')) {
    return memoryDb.users;
  }

  // 3. Members CRUD
  if (queryStr.includes('from members')) {
    // If selecting details
    if (queryStr.includes('where id =') || queryStr.includes('where m.id =')) {
      const id = parseInt(params[0]);
      const found = memoryDb.members.find(m => m.id === id);
      return found ? [found] : [];
    }
    // Return all
    return memoryDb.members.map(m => {
      const belt = memoryDb.belts.find(b => b.id === m.belt_id);
      return { ...m, belt_name: belt ? belt.name : 'Tanpa Sabuk' };
    });
  }

  // Default fallback for simulated actions
  return [];
}

// Audit Logger
async function logActivity(userId, action, target, details = '') {
  const ip = '127.0.0.1';
  if (useMemoryDb) {
    const id = memoryDb.activity_logs.length + 1;
    memoryDb.activity_logs.push({ id, user_id: userId, action, target, details, ip_address: ip, created_at: new Date() });
    return;
  }
  try {
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, target, details, ip_address) VALUES (?, ?, ?, ?, ?)',
      [userId, action, target, details, ip]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Access Token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Check Roles Middleware
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions' });
  }
  next();
};

// ========================================================
// REST API ENDPOINTS
// ========================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TMS Backend is active', useMemoryDb });
});

// ========================================================
// DASHBOARD STATS — Single aggregated endpoint
// ========================================================
app.get('/api/dashboard', async (req, res) => {
  try {
    if (useMemoryDb) {
      const members = memoryDb.members || [];
      const coaches = memoryDb.coaches || [];
      const dues = memoryDb.dues || [];
      const championships = memoryDb.championships || [];
      const attendances = memoryDb.member_attendances || [];

      // Member status counts
      const statusCounts = { aktif: 0, non_aktif: 0, lulus: 0, keluar: 0 };
      members.forEach(m => {
        const s = (m.status || 'aktif').toLowerCase();
        if (s === 'aktif') statusCounts.aktif++;
        else if (['non-aktif','tidak-aktif','tidak_aktif','non_aktif','pasif'].includes(s)) statusCounts.non_aktif++;
        else if (s === 'lulus') statusCounts.lulus++;
        else if (s === 'keluar') statusCounts.keluar++;
      });

      // Dues totals
      let totalDuesPaid = 0;
      let totalDuesUnpaid = 0;
      dues.forEach(d => {
        const amt = parseFloat(d.amount) || 0;
        if (d.status === 'sudah_bayar') totalDuesPaid += amt;
        else totalDuesUnpaid += amt;
      });

      // Monthly dues for current year
      const currentYear = new Date().getFullYear();
      const monthlyDues = Array(12).fill(0);
      dues.forEach(d => {
        if (d.status === 'sudah_bayar' && parseInt(d.year) === currentYear) {
          const idx = parseInt(d.month) - 1;
          if (idx >= 0 && idx < 12) monthlyDues[idx] += parseFloat(d.amount) || 0;
        }
      });

      // Attendance this month
      const now = new Date();
      const thisMonth = now.getMonth() + 1;
      const thisYear = now.getFullYear();
      const attendanceThisMonth = attendances.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() + 1 === thisMonth && d.getFullYear() === thisYear;
      }).length;

      return res.json({
        success: true,
        data: {
          totalMembers: members.length,
          activeMembers: statusCounts.aktif,
          inactiveMembers: statusCounts.non_aktif,
          lulusMembers: statusCounts.lulus,
          keluarMembers: statusCounts.keluar,
          totalCoaches: coaches.length,
          activeCoaches: coaches.filter(c => (c.status || 'aktif') === 'aktif').length,
          totalChampionships: championships.length,
          totalDuesPaid,
          totalDuesUnpaid,
          monthlyDues,
          attendanceThisMonth,
          memberStatusCounts: [
            statusCounts.aktif,
            statusCounts.non_aktif,
            statusCounts.lulus,
            statusCounts.keluar
          ]
        }
      });

    } else {
      // MySQL mode — run efficient aggregated queries
      const currentYear = new Date().getFullYear();
      const now = new Date();
      const thisMonth = now.getMonth() + 1;

      const [[memberStats]] = await pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status IN ('non-aktif','tidak-aktif','tidak_aktif','non_aktif','pasif') THEN 1 ELSE 0 END) as inactive,
          SUM(CASE WHEN status = 'lulus' THEN 1 ELSE 0 END) as lulus,
          SUM(CASE WHEN status = 'keluar' THEN 1 ELSE 0 END) as keluar
        FROM members
      `);

      const [[coachStats]] = await pool.query(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'aktif' THEN 1 ELSE 0 END) as active
        FROM coaches
      `);

      const [[duesStats]] = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN status = 'sudah_bayar' THEN amount ELSE 0 END), 0) as paid,
          COALESCE(SUM(CASE WHEN status != 'sudah_bayar' THEN amount ELSE 0 END), 0) as unpaid
        FROM dues
      `);

      const [[champStats]] = await pool.query(`SELECT COUNT(*) as total FROM championships`);

      const [monthlyRows] = await pool.query(`
        SELECT month, COALESCE(SUM(amount), 0) as total
        FROM dues
        WHERE status = 'sudah_bayar' AND year = ?
        GROUP BY month
      `, [currentYear]);

      const monthlyDues = Array(12).fill(0);
      monthlyRows.forEach(r => {
        const idx = parseInt(r.month) - 1;
        if (idx >= 0 && idx < 12) monthlyDues[idx] = parseFloat(r.total) || 0;
      });

      const [[attStats]] = await pool.query(`
        SELECT COUNT(*) as total FROM member_attendances
        WHERE MONTH(date) = ? AND YEAR(date) = ?
      `, [thisMonth, currentYear]);

      const active = parseInt(memberStats.active) || 0;
      const inactive = parseInt(memberStats.inactive) || 0;
      const lulus = parseInt(memberStats.lulus) || 0;
      const keluar = parseInt(memberStats.keluar) || 0;

      return res.json({
        success: true,
        data: {
          totalMembers: parseInt(memberStats.total) || 0,
          activeMembers: active,
          inactiveMembers: inactive,
          lulusMembers: lulus,
          keluarMembers: keluar,
          totalCoaches: parseInt(coachStats.total) || 0,
          activeCoaches: parseInt(coachStats.active) || 0,
          totalChampionships: parseInt(champStats.total) || 0,
          totalDuesPaid: parseFloat(duesStats.paid) || 0,
          totalDuesUnpaid: parseFloat(duesStats.unpaid) || 0,
          monthlyDues,
          attendanceThisMonth: parseInt(attStats.total) || 0,
          memberStatusCounts: [active, inactive, lulus, keluar]
        }
      });
    }
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
  }
});


app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  let user = null;
  if (useMemoryDb) {
    user = memoryDb.users.find(u => u.username === username);
  } else {
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND status = "aktif"', [username]);
      if (rows.length > 0) user = rows[0];
    } catch (e) {
      return res.status(500).json({ success: false, message: 'Database error' });
    }
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  await logActivity(user.id, 'LOGIN', 'auth', `User logged in successfully`);

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, username: user.username, role: user.role, name: user.name }
    }
  });
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  let user = null;
  if (useMemoryDb) {
    user = memoryDb.users.find(u => u.id === req.user.id);
  } else {
    const [rows] = await pool.query('SELECT id, username, name, role, status FROM users WHERE id = ?', [req.user.id]);
    if (rows.length > 0) user = rows[0];
  }

  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});


// APP SETTINGS
app.get('/api/settings', async (req, res) => {
  let settings = null;
  if (useMemoryDb) {
    settings = memoryDb.app_settings[0];
  } else {
    const [rows] = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    if (rows.length > 0) settings = rows[0];
  }
  res.json({ success: true, data: settings });
});

app.put('/api/settings', authenticateToken, checkRole(['super_admin']), upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'favicon', maxCount: 1 },
  { name: 'login_bg', maxCount: 1 },
  { name: 'dashboard_bg', maxCount: 1 },
  { name: 'dashboard_banner', maxCount: 1 }
]), async (req, res) => {
  const { app_name, dojang_name, address, whatsapp, email, main_color, footer_text, default_dues_amount } = req.body;
  
  let currentSettings = useMemoryDb 
    ? memoryDb.app_settings[0] 
    : (await pool.query('SELECT * FROM app_settings WHERE id = 1'))[0][0];

  const updateFields = {
    app_name: app_name || currentSettings.app_name,
    dojang_name: dojang_name || currentSettings.dojang_name,
    address: address || currentSettings.address,
    whatsapp: whatsapp || currentSettings.whatsapp,
    email: email || currentSettings.email,
    main_color: main_color || currentSettings.main_color,
    footer_text: footer_text || currentSettings.footer_text,
    default_dues_amount: default_dues_amount !== undefined ? parseFloat(default_dues_amount) : currentSettings.default_dues_amount,
    logo: req.files && req.files.logo ? `/uploads/${req.files.logo[0].filename}` : currentSettings.logo,
    favicon: req.files && req.files.favicon ? `/uploads/${req.files.favicon[0].filename}` : currentSettings.favicon,
    login_bg: req.files && req.files.login_bg ? `/uploads/${req.files.login_bg[0].filename}` : currentSettings.login_bg,
    dashboard_bg: req.files && req.files.dashboard_bg ? `/uploads/${req.files.dashboard_bg[0].filename}` : currentSettings.dashboard_bg,
    dashboard_banner: req.files && req.files.dashboard_banner ? `/uploads/${req.files.dashboard_banner[0].filename}` : currentSettings.dashboard_banner,
  };

  if (useMemoryDb) {
    memoryDb.app_settings[0] = { ...currentSettings, ...updateFields };
  } else {
    await pool.query(
      `UPDATE app_settings SET 
        app_name = ?, dojang_name = ?, address = ?, whatsapp = ?, email = ?, 
        main_color = ?, footer_text = ?, default_dues_amount = ?, logo = ?, favicon = ?, 
        login_bg = ?, dashboard_bg = ?, dashboard_banner = ? 
      WHERE id = 1`,
      [
        updateFields.app_name, updateFields.dojang_name, updateFields.address, updateFields.whatsapp, updateFields.email,
        updateFields.main_color, updateFields.footer_text, updateFields.default_dues_amount, updateFields.logo, updateFields.favicon,
        updateFields.login_bg, updateFields.dashboard_bg, updateFields.dashboard_banner
      ]
    );
  }

  await logActivity(req.user.id, 'UPDATE_SETTINGS', 'app_settings', 'App settings updated');
  res.json({ success: true, message: 'Settings updated successfully', data: updateFields });
});


// MASTER BELTS & CLASSES
app.get('/api/belts', async (req, res) => {
  let belts = [];
  if (useMemoryDb) {
    belts = memoryDb.belts;
  } else {
    [belts] = await pool.query('SELECT * FROM belts ORDER BY order_index ASC');
  }
  res.json({ success: true, data: belts });
});

app.post('/api/belts', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const { name, color, order_index } = req.body;
  if (!name || !color || !order_index) {
    return res.status(400).json({ success: false, message: 'Name, color, and order index are required' });
  }

  if (useMemoryDb) {
    const id = memoryDb.belts.length + 1;
    memoryDb.belts.push({ id, name, color, order_index: parseInt(order_index) });
  } else {
    await pool.query('INSERT INTO belts (name, color, order_index) VALUES (?, ?, ?)', [name, color, order_index]);
  }
  res.json({ success: true, message: 'Belt added successfully' });
});

app.get('/api/classes', async (req, res) => {
  let classes = [];
  if (useMemoryDb) {
    classes = memoryDb.classes;
  } else {
    [classes] = await pool.query('SELECT * FROM classes');
  }
  res.json({ success: true, data: classes });
});

app.post('/api/classes', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  if (useMemoryDb) {
    const id = memoryDb.classes.length + 1;
    memoryDb.classes.push({ id, name, description });
  } else {
    await pool.query('INSERT INTO classes (name, description) VALUES (?, ?)', [name, description]);
  }
  res.json({ success: true, message: 'Class created successfully' });
});


// MEMBERS (CRUD, Search, Pagination, Limit, Sorting, Filters, Excel Mock Export)
app.get('/api/members', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const beltId = req.query.belt_id || '';
  const status = req.query.status || '';
  const dojang = req.query.dojang || '';
  const sortBy = req.query.sortBy || 'name';
  const sortOrder = req.query.sortOrder || 'ASC';

  const offset = (page - 1) * limit;

  let allMembers = [];
  if (useMemoryDb) {
    allMembers = memoryDb.members.map(m => {
      const belt = memoryDb.belts.find(b => b.id === m.belt_id);
      return { ...m, belt_name: belt ? belt.name : 'Tanpa Sabuk' };
    });
  } else {
    const [rows] = await pool.query(`
      SELECT m.*, b.name as belt_name 
      FROM members m 
      LEFT JOIN belts b ON m.belt_id = b.id
    `);
    allMembers = rows;
  }

  // Apply filters
  let filtered = allMembers.filter(m => {
    const matchesSearch = search ? (
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_number.toLowerCase().includes(search.toLowerCase()) ||
      m.whatsapp.includes(search) ||
      (m.school && m.school.toLowerCase().includes(search.toLowerCase()))
    ) : true;

    const matchesBelt = beltId ? m.belt_id == beltId : true;
    const matchesStatus = status ? m.status === status : true;
    const matchesDojang = dojang ? m.dojang === dojang : true;

    return matchesSearch && matchesBelt && matchesStatus && matchesDojang;
  });

  // Sorting
  filtered.sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';
    if (typeof valA === 'string') {
      return sortOrder === 'ASC' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortOrder === 'ASC' ? valA - valB : valB - valA;
  });

  // Pagination slice
  const paginated = filtered.slice(offset, offset + limit);
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);

  res.json({
    success: true,
    data: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
});

app.get('/api/members/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  let member = null;
  let classes = [];

  if (useMemoryDb) {
    member = memoryDb.members.find(m => m.id === id);
    if (member) {
      const belt = memoryDb.belts.find(b => b.id === member.belt_id);
      member = { ...member, belt_name: belt ? belt.name : 'Tanpa Sabuk' };
      classes = memoryDb.member_classes
        .filter(mc => mc.member_id === id)
        .map(mc => memoryDb.classes.find(c => c.id === mc.class_id))
        .filter(Boolean);
    }
  } else {
    const [rows] = await pool.query(`
      SELECT m.*, b.name as belt_name 
      FROM members m 
      LEFT JOIN belts b ON m.belt_id = b.id 
      WHERE m.id = ?
    `, [id]);
    if (rows.length > 0) {
      member = rows[0];
      const [classRows] = await pool.query(`
        SELECT c.* FROM classes c 
        JOIN member_classes mc ON c.id = mc.class_id 
        WHERE mc.member_id = ?
      `, [id]);
      classes = classRows;
    }
  }

  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
  res.json({ success: true, data: { ...member, classes } });
});

app.post('/api/members', authenticateToken, checkRole(['super_admin', 'admin']), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'doc_akta', maxCount: 1 },
  { name: 'doc_kk', maxCount: 1 },
  { name: 'doc_photo', maxCount: 1 }
]), async (req, res) => {
  const { name, gender, birth_place, birth_date, parent_name, whatsapp, school, dojang, belt_id, weight, height, blood_type, address, status, joined_date, notes, class_ids } = req.body;

  // Compute auto age
  const birthYear = new Date(birth_date).getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Generate unique member number
  const prefix = 'TMS-' + new Date().getFullYear() + '-';
  let memberNumber = prefix + '0001';
  
  if (useMemoryDb) {
    const count = memoryDb.members.length + 1;
    memberNumber = prefix + String(count).padStart(4, '0');
  } else {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM members');
    memberNumber = prefix + String(rows[0].count + 1).padStart(4, '0');
  }

  const memberData = {
    member_number: memberNumber,
    name,
    gender,
    birth_place,
    birth_date,
    parent_name,
    whatsapp,
    school,
    dojang: dojang || '',
    belt_id: belt_id ? parseInt(belt_id) : null,
    weight: weight ? parseFloat(weight) : 0.0,
    height: height ? parseFloat(height) : 0.0,
    blood_type: blood_type || '-',
    address,
    status: status || 'aktif',
    joined_date: joined_date || new Date().toISOString().split('T')[0],
    notes: notes || '',
    photo: req.files && req.files.photo ? `/uploads/${req.files.photo[0].filename}` : '',
    doc_akta: req.files && req.files.doc_akta ? `/uploads/${req.files.doc_akta[0].filename}` : '',
    doc_kk: req.files && req.files.doc_kk ? `/uploads/${req.files.doc_kk[0].filename}` : '',
    doc_photo: req.files && req.files.doc_photo ? `/uploads/${req.files.doc_photo[0].filename}` : ''
  };

  let newMemberId = 0;
  if (useMemoryDb) {
    newMemberId = memoryDb.members.length + 1;
    memoryDb.members.push({ id: newMemberId, ...memberData });
    // Save classes
    if (class_ids) {
      const ids = Array.isArray(class_ids) ? class_ids : [class_ids];
      ids.forEach(cid => {
        memoryDb.member_classes.push({ member_id: newMemberId, class_id: parseInt(cid) });
      });
    }
  } else {
    const [result] = await pool.query(`
      INSERT INTO members (member_number, name, photo, gender, birth_place, birth_date, parent_name, whatsapp, school, dojang, belt_id, weight, height, blood_type, address, status, joined_date, notes, doc_akta, doc_kk, doc_photo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memberData.member_number, memberData.name, memberData.photo, memberData.gender, memberData.birth_place, memberData.birth_date,
      memberData.parent_name, memberData.whatsapp, memberData.school, memberData.dojang, memberData.belt_id, memberData.weight, memberData.height,
      memberData.blood_type, memberData.address, memberData.status, memberData.joined_date, memberData.notes,
      memberData.doc_akta, memberData.doc_kk, memberData.doc_photo
    ]);
    newMemberId = result.insertId;

    if (class_ids) {
      const ids = Array.isArray(class_ids) ? class_ids : [class_ids];
      for (const cid of ids) {
        await pool.query('INSERT INTO member_classes (member_id, class_id) VALUES (?, ?)', [newMemberId, parseInt(cid)]);
      }
    }
  }

  await logActivity(req.user.id, 'CREATE_MEMBER', 'members', `Created member: ${name} (${memberNumber})`);
  res.status(201).json({ success: true, message: 'Member created successfully', member_id: newMemberId });
});

app.put('/api/members/:id', authenticateToken, checkRole(['super_admin', 'admin']), upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'doc_akta', maxCount: 1 },
  { name: 'doc_kk', maxCount: 1 },
  { name: 'doc_photo', maxCount: 1 }
]), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, gender, birth_place, birth_date, parent_name, whatsapp, school, dojang, belt_id, weight, height, blood_type, address, status, joined_date, notes, class_ids } = req.body;

  let existing = null;
  if (useMemoryDb) {
    existing = memoryDb.members.find(m => m.id === id);
  } else {
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [id]);
    if (rows.length > 0) existing = rows[0];
  }

  if (!existing) return res.status(404).json({ success: false, message: 'Member not found' });

  const updatedData = {
    name: name || existing.name,
    gender: gender || existing.gender,
    birth_place: birth_place || existing.birth_place,
    birth_date: birth_date || existing.birth_date,
    parent_name: parent_name || existing.parent_name,
    whatsapp: whatsapp || existing.whatsapp,
    school: school || existing.school,
    dojang: dojang !== undefined ? dojang : existing.dojang,
    belt_id: belt_id ? parseInt(belt_id) : existing.belt_id,
    weight: weight ? parseFloat(weight) : existing.weight,
    height: height ? parseFloat(height) : existing.height,
    blood_type: blood_type || existing.blood_type,
    address: address || existing.address,
    status: status || existing.status,
    joined_date: joined_date || existing.joined_date,
    notes: notes || existing.notes,
    photo: req.files && req.files.photo ? `/uploads/${req.files.photo[0].filename}` : existing.photo,
    doc_akta: req.files && req.files.doc_akta ? `/uploads/${req.files.doc_akta[0].filename}` : existing.doc_akta,
    doc_kk: req.files && req.files.doc_kk ? `/uploads/${req.files.doc_kk[0].filename}` : existing.doc_kk,
    doc_photo: req.files && req.files.doc_photo ? `/uploads/${req.files.doc_photo[0].filename}` : existing.doc_photo
  };

  if (useMemoryDb) {
    const index = memoryDb.members.findIndex(m => m.id === id);
    memoryDb.members[index] = { ...existing, ...updatedData };
    
    // Update classes
    if (class_ids) {
      memoryDb.member_classes = memoryDb.member_classes.filter(mc => mc.member_id !== id);
      const ids = Array.isArray(class_ids) ? class_ids : [class_ids];
      ids.forEach(cid => {
        memoryDb.member_classes.push({ member_id: id, class_id: parseInt(cid) });
      });
    }
  } else {
    await pool.query(`
      UPDATE members SET 
        name = ?, gender = ?, birth_place = ?, birth_date = ?, parent_name = ?, whatsapp = ?, 
        school = ?, dojang = ?, belt_id = ?, weight = ?, height = ?, blood_type = ?, address = ?, 
        status = ?, joined_date = ?, notes = ?, photo = ?, doc_akta = ?, doc_kk = ?, doc_photo = ?
      WHERE id = ?
    `, [
      updatedData.name, updatedData.gender, updatedData.birth_place, updatedData.birth_date, updatedData.parent_name, updatedData.whatsapp,
      updatedData.school, updatedData.dojang, updatedData.belt_id, updatedData.weight, updatedData.height, updatedData.blood_type, updatedData.address,
      updatedData.status, updatedData.joined_date, updatedData.notes, updatedData.photo, updatedData.doc_akta, updatedData.doc_kk, updatedData.doc_photo,
      id
    ]);

    if (class_ids) {
      await pool.query('DELETE FROM member_classes WHERE member_id = ?', [id]);
      const ids = Array.isArray(class_ids) ? class_ids : [class_ids];
      for (const cid of ids) {
        await pool.query('INSERT INTO member_classes (member_id, class_id) VALUES (?, ?)', [id, parseInt(cid)]);
      }
    }
  }

  await logActivity(req.user.id, 'UPDATE_MEMBER', 'members', `Updated member: ${updatedData.name}`);
  res.json({ success: true, message: 'Member updated successfully' });
});

app.delete('/api/members/:id', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.members = memoryDb.members.filter(m => m.id !== id);
    memoryDb.member_classes = memoryDb.member_classes.filter(mc => mc.member_id !== id);
  } else {
    await pool.query('DELETE FROM members WHERE id = ?', [id]);
  }
  await logActivity(req.user.id, 'DELETE_MEMBER', 'members', `Deleted member ID: ${id}`);
  res.json({ success: true, message: 'Member deleted successfully' });
});


// DUES (IURAN - Create payment, multi-month payments, receipts upload, status automation)
app.get('/api/dues', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.dues.map(d => {
      const member = memoryDb.members.find(m => m.id === d.member_id);
      return { ...d, member_name: member ? member.name : 'Unknown Member', member_number: member ? member.member_number : '', member_dojang: member ? member.dojang : '' };
    });
  } else {
    [list] = await pool.query(`
      SELECT d.*, m.name as member_name, m.member_number, m.dojang as member_dojang 
      FROM dues d 
      JOIN members m ON d.member_id = m.id
      ORDER BY d.year DESC, d.month DESC
    `);
  }
  res.json({ success: true, data: list });
});

app.post('/api/dues/pay', authenticateToken, checkRole(['super_admin', 'admin', 'finance']), upload.single('attachment'), async (req, res) => {
  const { member_id, months, year, amount, method, notes } = req.body;
  if (!member_id || !months || !year || !amount || !method) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const parsedMonths = Array.isArray(months) ? months : JSON.parse(months); // e.g. [1, 2, 3] for Multi-months
  const totalAmount = parseFloat(amount);
  const perMonthAmount = totalAmount / parsedMonths.length;

  const results = [];
  for (const month of parsedMonths) {
    const dueRecord = {
      member_id: parseInt(member_id),
      month: parseInt(month),
      year: parseInt(year),
      amount: perMonthAmount,
      payment_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
      officer_id: req.user.id,
      method,
      status: 'sudah_bayar',
      notes: notes || '',
      attachment: req.file ? `/uploads/${req.file.filename}` : ''
    };

    if (useMemoryDb) {
      dueRecord.id = memoryDb.dues.length + 1;
      memoryDb.dues.push(dueRecord);
      results.push(dueRecord);
    } else {
      const [ins] = await pool.query(`
        INSERT INTO dues (member_id, month, year, amount, payment_date, officer_id, method, status, notes, attachment)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        dueRecord.member_id, dueRecord.month, dueRecord.year, dueRecord.amount, dueRecord.payment_date,
        dueRecord.officer_id, dueRecord.method, dueRecord.status, dueRecord.notes, dueRecord.attachment
      ]);
      dueRecord.id = ins.insertId;
      results.push(dueRecord);
    }
  }

  await logActivity(req.user.id, 'PAY_DUES', 'dues', `Paid dues for Member ID: ${member_id} months: ${parsedMonths.join(', ')}`);
  res.json({ success: true, message: 'Dues registered successfully', data: results });
});

app.put('/api/dues/:id', authenticateToken, checkRole(['super_admin', 'admin', 'finance']), upload.single('attachment'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { member_id, month, year, amount, method, status, notes } = req.body;
  let attachment = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (useMemoryDb) {
    const idx = memoryDb.dues.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Dues record not found' });
    memoryDb.dues[idx] = {
      ...memoryDb.dues[idx],
      member_id: member_id !== undefined ? parseInt(member_id) : memoryDb.dues[idx].member_id,
      month: month !== undefined ? parseInt(month) : memoryDb.dues[idx].month,
      year: year !== undefined ? parseInt(year) : memoryDb.dues[idx].year,
      amount: amount !== undefined ? parseFloat(amount) : memoryDb.dues[idx].amount,
      method: method !== undefined ? method : memoryDb.dues[idx].method,
      status: status !== undefined ? status : memoryDb.dues[idx].status,
      notes: notes !== undefined ? notes : memoryDb.dues[idx].notes,
      attachment: attachment !== undefined ? attachment : memoryDb.dues[idx].attachment
    };
  } else {
    let query = 'UPDATE dues SET member_id = ?, month = ?, year = ?, amount = ?, method = ?, status = ?, notes = ?';
    let params = [parseInt(member_id), parseInt(month), parseInt(year), parseFloat(amount), method, status, notes || ''];
    if (attachment !== undefined) {
      query += ', attachment = ?';
      params.push(attachment);
    }
    query += ' WHERE id = ?';
    params.push(id);
    await pool.query(query, params);
  }
  res.json({ success: true, message: 'Dues record updated' });
});

app.delete('/api/dues/:id', authenticateToken, checkRole(['super_admin', 'admin', 'finance']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.dues = memoryDb.dues.filter(d => d.id !== id);
  } else {
    await pool.query('DELETE FROM dues WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Dues record deleted' });
});


// COACHES & ATTENDANCE & HONOR
app.get('/api/coaches', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.coaches;
  } else {
    [list] = await pool.query('SELECT * FROM coaches');
  }
  res.json({ success: true, data: list });
});

app.post('/api/coaches', authenticateToken, checkRole(['super_admin']), upload.single('photo'), async (req, res) => {
  const { name, whatsapp, address, base_honor, status } = req.body;
  
  const coachData = {
    name,
    whatsapp,
    address,
    base_honor: parseFloat(base_honor) || 0.0,
    status: status || 'aktif',
    photo: req.file ? `/uploads/${req.file.filename}` : ''
  };

  if (useMemoryDb) {
    coachData.id = memoryDb.coaches.length + 1;
    memoryDb.coaches.push(coachData);
  } else {
    await pool.query('INSERT INTO coaches (name, photo, whatsapp, address, base_honor, status) VALUES (?, ?, ?, ?, ?, ?)', [
      coachData.name, coachData.photo, coachData.whatsapp, coachData.address, coachData.base_honor, coachData.status
    ]);
  }

  res.json({ success: true, message: 'Coach added successfully' });
});

app.put('/api/coaches/:id', authenticateToken, checkRole(['super_admin']), upload.single('photo'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, whatsapp, address, base_honor, status } = req.body;
  let photo = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (useMemoryDb) {
    const idx = memoryDb.coaches.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Coach not found' });
    memoryDb.coaches[idx] = {
      ...memoryDb.coaches[idx],
      name: name !== undefined ? name : memoryDb.coaches[idx].name,
      whatsapp: whatsapp !== undefined ? whatsapp : memoryDb.coaches[idx].whatsapp,
      address: address !== undefined ? address : memoryDb.coaches[idx].address,
      base_honor: base_honor !== undefined ? parseFloat(base_honor) : memoryDb.coaches[idx].base_honor,
      status: status !== undefined ? status : memoryDb.coaches[idx].status,
      photo: photo !== undefined ? photo : memoryDb.coaches[idx].photo
    };
  } else {
    let query = 'UPDATE coaches SET name = ?, whatsapp = ?, address = ?, base_honor = ?, status = ?';
    let params = [name, whatsapp, address, parseFloat(base_honor) || 0.0, status || 'aktif'];
    if (photo !== undefined) {
      query += ', photo = ?';
      params.push(photo);
    }
    query += ' WHERE id = ?';
    params.push(id);
    await pool.query(query, params);
  }
  res.json({ success: true, message: 'Coach updated successfully' });
});

app.delete('/api/coaches/:id', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.coaches = memoryDb.coaches.filter(c => c.id !== id);
    memoryDb.coach_attendances = memoryDb.coach_attendances.filter(a => a.coach_id !== id);
  } else {
    await pool.query('DELETE FROM coaches WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Coach deleted successfully' });
});

app.post('/api/attendance/coach', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const { coach_id, date, status, time_in, time_out } = req.body;
  if (!coach_id || !date || !status) return res.status(400).json({ success: false, message: 'Fields missing' });

  // Fetch coach to get base honor
  let coach = null;
  if (useMemoryDb) {
    coach = memoryDb.coaches.find(c => c.id === parseInt(coach_id));
  } else {
    const [rows] = await pool.query('SELECT * FROM coaches WHERE id = ?', [coach_id]);
    if (rows.length > 0) coach = rows[0];
  }

  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });

  // Honor calculated automatically (only when "hadir")
  const honor = status === 'hadir' ? parseFloat(coach.base_honor) : 0.0;

  const attendanceData = {
    coach_id: parseInt(coach_id),
    date,
    status,
    time_in: time_in || null,
    time_out: time_out || null,
    honor_calculated: honor
  };

  if (useMemoryDb) {
    attendanceData.id = memoryDb.coach_attendances.length + 1;
    memoryDb.coach_attendances.push(attendanceData);
  } else {
    await pool.query('INSERT INTO coach_attendances (coach_id, date, time_in, time_out, status, honor_calculated) VALUES (?, ?, ?, ?, ?, ?)', [
      attendanceData.coach_id, attendanceData.date, attendanceData.time_in, attendanceData.time_out, attendanceData.status, attendanceData.honor_calculated
    ]);
  }

  res.json({ success: true, message: 'Coach attendance recorded', honor_calculated: honor });
});

app.get('/api/reports/honor', authenticateToken, async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.coach_attendances.map(a => {
      const coach = memoryDb.coaches.find(c => c.id === a.coach_id);
      return { ...a, coach_name: coach ? coach.name : 'Unknown' };
    });
  } else {
    [list] = await pool.query(`
      SELECT ca.*, c.name as coach_name 
      FROM coach_attendances ca 
      JOIN coaches c ON ca.coach_id = c.id
      ORDER BY ca.date DESC
    `);
  }
  res.json({ success: true, data: list });
});

app.put('/api/reports/honor/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { coach_id, date, status, time_in, time_out } = req.body;

  // Fetch coach to get base honor
  let coach = null;
  if (useMemoryDb) {
    coach = memoryDb.coaches.find(c => c.id === parseInt(coach_id));
  } else {
    const [rows] = await pool.query('SELECT * FROM coaches WHERE id = ?', [coach_id]);
    if (rows.length > 0) coach = rows[0];
  }

  if (!coach) return res.status(404).json({ success: false, message: 'Coach not found' });
  const honor = status === 'hadir' ? parseFloat(coach.base_honor) : 0.0;

  if (useMemoryDb) {
    const idx = memoryDb.coach_attendances.findIndex(a => a.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Attendance record not found' });
    memoryDb.coach_attendances[idx] = {
      ...memoryDb.coach_attendances[idx],
      coach_id: parseInt(coach_id),
      date,
      status,
      time_in: time_in || null,
      time_out: time_out || null,
      honor_calculated: honor
    };
  } else {
    await pool.query(`
      UPDATE coach_attendances 
      SET coach_id = ?, date = ?, status = ?, time_in = ?, time_out = ?, honor_calculated = ?
      WHERE id = ?
    `, [parseInt(coach_id), date, status, time_in || null, time_out || null, honor, id]);
  }

  res.json({ success: true, message: 'Coach attendance updated successfully' });
});

app.delete('/api/reports/honor/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.coach_attendances = memoryDb.coach_attendances.filter(a => a.id !== id);
  } else {
    await pool.query('DELETE FROM coach_attendances WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Coach attendance deleted successfully' });
});


// MEMBER ATTENDANCE
app.post('/api/attendance/members', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const { date, class_id, coach_id, attendances } = req.body; // attendances is array of { member_id, status }
  if (!date || !attendances) return res.status(400).json({ success: false, message: 'Invalid data' });

  for (const att of attendances) {
    const record = {
      member_id: parseInt(att.member_id),
      date,
      class_id: class_id ? parseInt(class_id) : null,
      coach_id: coach_id ? parseInt(coach_id) : null,
      status: att.status
    };

    if (useMemoryDb) {
      record.id = memoryDb.member_attendances.length + 1;
      memoryDb.member_attendances.push(record);
    } else {
      await pool.query('INSERT INTO member_attendances (member_id, date, class_id, coach_id, status) VALUES (?, ?, ?, ?, ?)', [
        record.member_id, record.date, record.class_id, record.coach_id, record.status
      ]);
    }
  }

  res.json({ success: true, message: 'Members attendance submitted' });
});

app.get('/api/attendance/members', async (req, res) => {
  const { month, year } = req.query;
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.member_attendances.map(a => {
      const m = memoryDb.members.find(member => member.id === a.member_id);
      const c = memoryDb.classes.find(cls => cls.id === a.class_id);
      return { ...a, member_name: m ? m.name : 'Unknown', class_name: c ? c.name : '' };
    });
    if (month && year) {
      list = list.filter(a => {
        const d = new Date(a.date);
        return (d.getMonth() + 1) === parseInt(month) && d.getFullYear() === parseInt(year);
      });
    }
  } else {
    let query = `
      SELECT ma.*, m.name as member_name, c.name as class_name 
      FROM member_attendances ma
      JOIN members m ON ma.member_id = m.id
      LEFT JOIN classes c ON ma.class_id = c.id
    `;
    const params = [];
    if (month && year) {
      query += ` WHERE MONTH(ma.date) = ? AND YEAR(ma.date) = ?`;
      params.push(parseInt(month), parseInt(year));
    }
    query += ` ORDER BY ma.date DESC`;
    [list] = await pool.query(query, params);
  }
  res.json({ success: true, data: list });
});


// TRAINING PROGRAMS & JADWAL
app.get('/api/programs', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.training_programs;
  } else {
    [list] = await pool.query('SELECT * FROM training_programs');
  }
  res.json({ success: true, data: list });
});

app.post('/api/programs', authenticateToken, checkRole(['super_admin']), upload.single('image'), async (req, res) => {
  const { name, category, description, target, duration } = req.body;
  const programData = {
    name,
    category,
    description,
    target,
    duration,
    image: req.file ? `/uploads/${req.file.filename}` : '',
    video: '',
    is_active: 1
  };

  if (useMemoryDb) {
    programData.id = memoryDb.training_programs.length + 1;
    memoryDb.training_programs.push(programData);
  } else {
    await pool.query('INSERT INTO training_programs (name, category, description, target, duration, image, video, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
      programData.name, programData.category, programData.description, programData.target, programData.duration, programData.image, programData.video, programData.is_active
    ]);
  }
  res.json({ success: true, message: 'Training program created' });
});

app.put('/api/programs/:id', authenticateToken, checkRole(['super_admin']), upload.single('image'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, description, target, duration } = req.body;
  let image = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (useMemoryDb) {
    const idx = memoryDb.training_programs.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Program not found' });
    memoryDb.training_programs[idx] = {
      ...memoryDb.training_programs[idx],
      name: name !== undefined ? name : memoryDb.training_programs[idx].name,
      category: category !== undefined ? category : memoryDb.training_programs[idx].category,
      description: description !== undefined ? description : memoryDb.training_programs[idx].description,
      target: target !== undefined ? target : memoryDb.training_programs[idx].target,
      duration: duration !== undefined ? duration : memoryDb.training_programs[idx].duration,
      image: image !== undefined ? image : memoryDb.training_programs[idx].image
    };
  } else {
    let query = 'UPDATE training_programs SET name = ?, category = ?, description = ?, target = ?, duration = ?';
    let params = [name, category, description, target, duration];
    if (image !== undefined) {
      query += ', image = ?';
      params.push(image);
    }
    query += ' WHERE id = ?';
    params.push(id);
    await pool.query(query, params);
  }
  res.json({ success: true, message: 'Training program updated' });
});

app.delete('/api/programs/:id', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.training_programs = memoryDb.training_programs.filter(p => p.id !== id);
  } else {
    await pool.query('DELETE FROM training_programs WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Training program deleted' });
});


// PHYSICAL TESTS (CRUD types, Input Results with weight category checking and progression comparison)
app.get('/api/physical-tests/types', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.physical_test_types;
  } else {
    [list] = await pool.query('SELECT * FROM physical_test_types');
  }
  res.json({ success: true, data: list });
});

app.post('/api/physical-tests/types', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  const { name, category, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

  if (useMemoryDb) {
    const id = memoryDb.physical_test_types.length + 1;
    memoryDb.physical_test_types.push({ id, name, category, description });
  } else {
    await pool.query('INSERT INTO physical_test_types (name, category, description) VALUES (?, ?, ?)', [name, category, description]);
  }
  res.json({ success: true, message: 'Physical test type added' });
});

app.get('/api/physical-tests/results', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.physical_test_results.map(r => {
      const m = memoryDb.members.find(member => member.id === r.member_id);
      const t = memoryDb.physical_test_types.find(type => type.id === r.test_type_id);
      return { ...r, member_name: m ? m.name : 'Unknown', test_name: t ? t.name : 'Unknown' };
    });
  } else {
    [list] = await pool.query(`
      SELECT ptr.*, m.name as member_name, ptt.name as test_name 
      FROM physical_test_results ptr
      JOIN members m ON ptr.member_id = m.id
      JOIN physical_test_types ptt ON ptr.test_type_id = ptt.id
      ORDER BY ptr.date DESC
    `);
  }
  res.json({ success: true, data: list });
});

app.post('/api/physical-tests/results', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const { member_id, test_type_id, date, target_value, result_value, notes } = req.body;
  if (!member_id || !test_type_id || !result_value) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  // Automatic Evaluation Logic
  // Target: "12" or "40", Result: "11.8" or "35"
  const numericTarget = parseFloat(target_value);
  const numericResult = parseFloat(result_value);
  let evaluation = '';

  if (!isNaN(numericTarget) && !isNaN(numericResult)) {
    // Check if sprinting/timer where LOWER is better or pushups where HIGHER is better
    // For simplicity, we can do relative comparison or custom rules based on test type name
    let testType = null;
    if (useMemoryDb) {
      testType = memoryDb.physical_test_types.find(t => t.id === parseInt(test_type_id));
    } else {
      const [rows] = await pool.query('SELECT * FROM physical_test_types WHERE id = ?', [test_type_id]);
      if (rows.length > 0) testType = rows[0];
    }

    const name = (testType ? testType.name : '').toLowerCase();
    const isTimer = name.includes('sprint') || name.includes('detik') || name.includes('run') || name.includes('time');

    if (isTimer) {
      if (numericResult <= numericTarget) {
        evaluation = `Target tercapai. Lebih cepat ${Math.abs(numericTarget - numericResult).toFixed(2)} detik!`;
      } else {
        evaluation = `Masih kurang ${Math.abs(numericResult - numericTarget).toFixed(2)} detik untuk mencapai target.`;
      }
    } else {
      if (numericResult >= numericTarget) {
        evaluation = `Target tercapai. Melebihi target sebanyak ${Math.abs(numericResult - numericTarget)} kali!`;
      } else {
        evaluation = `Masih kurang ${Math.abs(numericTarget - numericResult)} kali untuk mencapai target.`;
      }
    }
  } else {
    evaluation = 'Hasil tercatat.';
  }

  // Calculate status (naik, turun, stabil) based on previous records
  let status = 'stabil';
  let previousResults = [];
  if (useMemoryDb) {
    previousResults = memoryDb.physical_test_results
      .filter(r => r.member_id === parseInt(member_id) && r.test_type_id === parseInt(test_type_id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    const [rows] = await pool.query(
      'SELECT * FROM physical_test_results WHERE member_id = ? AND test_type_id = ? ORDER BY date DESC LIMIT 1',
      [member_id, test_type_id]
    );
    previousResults = rows;
  }

  if (previousResults.length > 0) {
    const prev = previousResults[0];
    const prevVal = parseFloat(prev.result_value);
    const currVal = parseFloat(result_value);
    if (!isNaN(prevVal) && !isNaN(currVal)) {
      if (currVal > prevVal) status = 'naik';
      else if (currVal < prevVal) status = 'turun';
    }
  }

  const resultData = {
    member_id: parseInt(member_id),
    test_type_id: parseInt(test_type_id),
    date,
    target_value: String(target_value),
    result_value: String(result_value),
    notes: notes || '',
    evaluation,
    status
  };

  if (useMemoryDb) {
    resultData.id = memoryDb.physical_test_results.length + 1;
    memoryDb.physical_test_results.push(resultData);
  } else {
    await pool.query(`
      INSERT INTO physical_test_results (member_id, test_type_id, date, target_value, result_value, notes, evaluation, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      resultData.member_id, resultData.test_type_id, resultData.date, resultData.target_value,
      resultData.result_value, resultData.notes, resultData.evaluation, resultData.status
    ]);
  }

  res.json({ success: true, message: 'Physical test results saved', evaluation, status });
});

app.put('/api/physical-tests/results/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { member_id, test_type_id, date, target_value, result_value, notes } = req.body;

  if (!member_id || !test_type_id || !result_value) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  // Automatic Evaluation Logic
  const numericTarget = parseFloat(target_value);
  const numericResult = parseFloat(result_value);
  let evaluation = '';

  if (!isNaN(numericTarget) && !isNaN(numericResult)) {
    let testType = null;
    if (useMemoryDb) {
      testType = memoryDb.physical_test_types.find(t => t.id === parseInt(test_type_id));
    } else {
      const [rows] = await pool.query('SELECT * FROM physical_test_types WHERE id = ?', [test_type_id]);
      if (rows.length > 0) testType = rows[0];
    }

    const name = (testType ? testType.name : '').toLowerCase();
    const isTimer = name.includes('sprint') || name.includes('detik') || name.includes('run') || name.includes('time');

    if (isTimer) {
      if (numericResult <= numericTarget) {
        evaluation = `Target tercapai. Lebih cepat ${Math.abs(numericTarget - numericResult).toFixed(2)} detik!`;
      } else {
        evaluation = `Masih kurang ${Math.abs(numericResult - numericTarget).toFixed(2)} detik untuk mencapai target.`;
      }
    } else {
      if (numericResult >= numericTarget) {
        evaluation = `Target tercapai. Melebihi target sebanyak ${Math.abs(numericResult - numericTarget)} kali!`;
      } else {
        evaluation = `Masih kurang ${Math.abs(numericTarget - numericResult)} kali untuk mencapai target.`;
      }
    }
  } else {
    evaluation = 'Hasil tercatat.';
  }

  // Calculate status (naik, turun, stabil) based on previous records
  let status = 'stabil';
  let previousResults = [];
  if (useMemoryDb) {
    previousResults = memoryDb.physical_test_results
      .filter(r => r.member_id === parseInt(member_id) && r.test_type_id === parseInt(test_type_id) && r.id !== id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    const [rows] = await pool.query(
      'SELECT * FROM physical_test_results WHERE member_id = ? AND test_type_id = ? AND id != ? ORDER BY date DESC LIMIT 1',
      [member_id, test_type_id, id]
    );
    previousResults = rows;
  }

  if (previousResults.length > 0) {
    const prev = previousResults[0];
    const prevVal = parseFloat(prev.result_value);
    const currVal = parseFloat(result_value);
    if (!isNaN(prevVal) && !isNaN(currVal)) {
      if (currVal > prevVal) status = 'naik';
      else if (currVal < prevVal) status = 'turun';
    }
  }

  if (useMemoryDb) {
    const idx = memoryDb.physical_test_results.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Result not found' });
    memoryDb.physical_test_results[idx] = {
      ...memoryDb.physical_test_results[idx],
      member_id: parseInt(member_id),
      test_type_id: parseInt(test_type_id),
      date,
      target_value: String(target_value),
      result_value: String(result_value),
      notes: notes || '',
      evaluation,
      status
    };
  } else {
    await pool.query(`
      UPDATE physical_test_results 
      SET member_id = ?, test_type_id = ?, date = ?, target_value = ?, result_value = ?, notes = ?, evaluation = ?, status = ?
      WHERE id = ?
    `, [parseInt(member_id), parseInt(test_type_id), date, String(target_value), String(result_value), notes || '', evaluation, status, id]);
  }

  res.json({ success: true, message: 'Physical test results updated', evaluation, status });
});

app.delete('/api/physical-tests/results/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.physical_test_results = memoryDb.physical_test_results.filter(r => r.id !== id);
  } else {
    await pool.query('DELETE FROM physical_test_results WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Physical test result deleted' });
});


// CHAMPIONSHIPS (Master Kejuaraan, Participants weight checking, target medal)
app.get('/api/championships', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.championships;
  } else {
    [list] = await pool.query('SELECT * FROM championships');
  }
  res.json({ success: true, data: list });
});

app.post('/api/championships', authenticateToken, checkRole(['super_admin', 'admin']), upload.single('poster'), async (req, res) => {
  const { name, location, date, organizer, level, description } = req.body;
  const data = {
    name,
    location,
    date,
    organizer,
    level,
    description,
    poster: req.file ? `/uploads/${req.file.filename}` : ''
  };

  if (useMemoryDb) {
    data.id = memoryDb.championships.length + 1;
    memoryDb.championships.push(data);
  } else {
    await pool.query('INSERT INTO championships (name, location, date, organizer, level, poster, description) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      data.name, data.location, data.date, data.organizer, data.level, data.poster, data.description
    ]);
  }
  res.json({ success: true, message: 'Championship event added' });
});

app.put('/api/championships/:id', authenticateToken, checkRole(['super_admin', 'admin']), upload.single('poster'), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, location, date, organizer, level, description } = req.body;
  let poster = req.file ? `/uploads/${req.file.filename}` : undefined;

  if (useMemoryDb) {
    const idx = memoryDb.championships.findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Championship not found' });
    memoryDb.championships[idx] = {
      ...memoryDb.championships[idx],
      name: name !== undefined ? name : memoryDb.championships[idx].name,
      location: location !== undefined ? location : memoryDb.championships[idx].location,
      date: date !== undefined ? date : memoryDb.championships[idx].date,
      organizer: organizer !== undefined ? organizer : memoryDb.championships[idx].organizer,
      level: level !== undefined ? level : memoryDb.championships[idx].level,
      description: description !== undefined ? description : memoryDb.championships[idx].description,
      poster: poster !== undefined ? poster : memoryDb.championships[idx].poster
    };
  } else {
    let query = 'UPDATE championships SET name = ?, location = ?, date = ?, organizer = ?, level = ?, description = ?';
    let params = [name, location, date, organizer, level, description];
    if (poster !== undefined) {
      query += ', poster = ?';
      params.push(poster);
    }
    query += ' WHERE id = ?';
    params.push(id);
    await pool.query(query, params);
  }
  res.json({ success: true, message: 'Championship updated' });
});

app.delete('/api/championships/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.championships = memoryDb.championships.filter(c => c.id !== id);
    memoryDb.championship_participants = memoryDb.championship_participants.filter(p => p.championship_id !== id);
  } else {
    await pool.query('DELETE FROM championships WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Championship deleted' });
});

// GET master classes
app.get('/api/championships/classes', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.championship_classes || [];
  } else {
    [list] = await pool.query('SELECT * FROM championship_classes ORDER BY category, age_group, class_name');
  }
  res.json({ success: true, data: list });
});

// POST master class
app.post('/api/championships/classes', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const { category, age_group, gender, class_name, min_weight, max_weight } = req.body;
  if (!category || !age_group || !class_name) {
    return res.status(400).json({ success: false, message: 'Required fields missing' });
  }

  const data = {
    category,
    age_group,
    gender: gender || 'Semua',
    class_name,
    min_weight: parseFloat(min_weight) || 0.00,
    max_weight: parseFloat(max_weight) || 999.99
  };

  let newId = 0;
  if (useMemoryDb) {
    newId = (memoryDb.championship_classes || []).length + 1;
    if (!memoryDb.championship_classes) memoryDb.championship_classes = [];
    memoryDb.championship_classes.push({ id: newId, ...data });
  } else {
    const [result] = await pool.query(`
      INSERT INTO championship_classes (category, age_group, gender, class_name, min_weight, max_weight)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [data.category, data.age_group, data.gender, data.class_name, data.min_weight, data.max_weight]);
    newId = result.insertId;
  }

  res.status(201).json({ success: true, message: 'Class created successfully', id: newId });
});

// PUT master class
app.put('/api/championships/classes/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { category, age_group, gender, class_name, min_weight, max_weight } = req.body;

  if (useMemoryDb) {
    const idx = (memoryDb.championship_classes || []).findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Class not found' });
    memoryDb.championship_classes[idx] = {
      ...memoryDb.championship_classes[idx],
      category: category || memoryDb.championship_classes[idx].category,
      age_group: age_group || memoryDb.championship_classes[idx].age_group,
      gender: gender || memoryDb.championship_classes[idx].gender,
      class_name: class_name || memoryDb.championship_classes[idx].class_name,
      min_weight: min_weight !== undefined ? parseFloat(min_weight) : memoryDb.championship_classes[idx].min_weight,
      max_weight: max_weight !== undefined ? parseFloat(max_weight) : memoryDb.championship_classes[idx].max_weight
    };
  } else {
    await pool.query(`
      UPDATE championship_classes 
      SET category = ?, age_group = ?, gender = ?, class_name = ?, min_weight = ?, max_weight = ?
      WHERE id = ?
    `, [category, age_group, gender, class_name, parseFloat(min_weight), parseFloat(max_weight), id]);
  }

  res.json({ success: true, message: 'Class updated successfully' });
});

// DELETE master class
app.delete('/api/championships/classes/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.championship_classes = (memoryDb.championship_classes || []).filter(c => c.id !== id);
  } else {
    await pool.query('DELETE FROM championship_classes WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Class deleted successfully' });
});

// Validate member category weight
app.post('/api/championships/validate-weight', authenticateToken, async (req, res) => {
  const { member_id, class_id, category } = req.body;
  if (!member_id) return res.status(400).json({ success: false, message: 'member_id is required' });

  let member = null;
  if (useMemoryDb) {
    member = memoryDb.members.find(m => m.id === parseInt(member_id));
  } else {
    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [member_id]);
    if (rows.length > 0) member = rows[0];
  }

  if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

  const mWeight = parseFloat(member.weight);

  if (class_id) {
    let tClass = null;
    if (useMemoryDb) {
      tClass = memoryDb.championship_classes.find(c => c.id === parseInt(class_id));
    } else {
      const [rows] = await pool.query('SELECT * FROM championship_classes WHERE id = ?', [class_id]);
      if (rows.length > 0) tClass = rows[0];
    }

    if (tClass) {
      const minW = parseFloat(tClass.min_weight || 0.00);
      const maxW = parseFloat(tClass.max_weight || 999.99);

      if (mWeight > maxW) {
        const diff = (mWeight - maxW).toFixed(1);
        return res.json({
          success: true,
          valid: false,
          warning: `Berat badan melebihi batas kategori (Maks: ${maxW} kg). Selisih +${diff} kg`,
          limit: maxW,
          weight: mWeight
        });
      } else if (mWeight < minW) {
        const diff = (minW - mWeight).toFixed(1);
        return res.json({
          success: true,
          valid: false,
          warning: `Berat badan kurang dari batas kategori (Min: ${minW} kg). Selisih -${diff} kg`,
          limit: minW,
          weight: mWeight
        });
      }
    }
  } else if (category) {
    const regex = /under\s*(\d+)/i;
    const match = category.match(regex);
    if (match) {
      const limit = parseFloat(match[1]);
      if (mWeight > limit) {
        const diff = (mWeight - limit).toFixed(1);
        return res.json({
          success: true,
          valid: false,
          warning: `Berat badan melebihi batas kategori. Selisih +${diff}kg`,
          limit,
          weight: mWeight
        });
      }
    }
  }

  res.json({ success: true, valid: true });
});

app.post('/api/championships/participants', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const { championship_id, member_id, match_number, category, class_id, belt_id, weight, target_medal } = req.body;

  const data = {
    championship_id: parseInt(championship_id),
    member_id: parseInt(member_id),
    match_number: match_number || '',
    category,
    class_id: class_id ? parseInt(class_id) : null,
    belt_id: belt_id ? parseInt(belt_id) : null,
    weight: parseFloat(weight) || 0.0,
    target_medal: target_medal || '',
    result: null,
    medal: 'none',
    weigh_in_weight: null,
    weigh_in_status: 'unweighed'
  };

  if (useMemoryDb) {
    data.id = memoryDb.championship_participants.length + 1;
    memoryDb.championship_participants.push(data);
  } else {
    await pool.query(`
      INSERT INTO championship_participants (championship_id, member_id, match_number, category, class_id, belt_id, weight, target_medal, weigh_in_weight, weigh_in_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'unweighed')
    `, [
      data.championship_id, data.member_id, data.match_number, data.category, data.class_id, data.belt_id, data.weight, data.target_medal
    ]);
  }

  res.json({ success: true, message: 'Participant registered successfully' });
});

app.get('/api/championships/participants', async (req, res) => {
  let list = [];
  if (useMemoryDb) {
    list = memoryDb.championship_participants.map(p => {
      const m = memoryDb.members.find(member => member.id === p.member_id);
      const c = memoryDb.championships.find(ch => ch.id === p.championship_id);
      const cc = memoryDb.championship_classes ? memoryDb.championship_classes.find(cls => cls.id === p.class_id) : null;
      return { 
        ...p, 
        member_name: m ? m.name : 'Unknown', 
        championship_name: c ? c.name : 'Unknown',
        class_category: cc ? cc.category : '',
        class_age_group: cc ? cc.age_group : '',
        class_gender: cc ? cc.gender : '',
        class_class_name: cc ? cc.class_name : '',
        class_min_weight: cc ? cc.min_weight : 0.00,
        class_max_weight: cc ? cc.max_weight : 999.99
      };
    });
  } else {
    [list] = await pool.query(`
      SELECT cp.*, m.name as member_name, c.name as championship_name,
             cc.category as class_category, cc.age_group as class_age_group,
             cc.gender as class_gender, cc.class_name as class_class_name,
             cc.min_weight as class_min_weight, cc.max_weight as class_max_weight
      FROM championship_participants cp
      JOIN members m ON cp.member_id = m.id
      JOIN championships c ON cp.championship_id = c.id
      LEFT JOIN championship_classes cc ON cp.class_id = cc.id
    `);
  }
  res.json({ success: true, data: list });
});

app.put('/api/championships/participants/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { championship_id, member_id, match_number, category, class_id, belt_id, weight, target_medal, medal } = req.body;

  if (useMemoryDb) {
    const idx = memoryDb.championship_participants.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Participant not found' });
    memoryDb.championship_participants[idx] = {
      ...memoryDb.championship_participants[idx],
      championship_id: championship_id !== undefined ? parseInt(championship_id) : memoryDb.championship_participants[idx].championship_id,
      member_id: member_id !== undefined ? parseInt(member_id) : memoryDb.championship_participants[idx].member_id,
      match_number: match_number !== undefined ? match_number : memoryDb.championship_participants[idx].match_number,
      category: category !== undefined ? category : memoryDb.championship_participants[idx].category,
      class_id: class_id !== undefined ? (class_id ? parseInt(class_id) : null) : memoryDb.championship_participants[idx].class_id,
      belt_id: belt_id !== undefined ? (belt_id ? parseInt(belt_id) : null) : memoryDb.championship_participants[idx].belt_id,
      weight: weight !== undefined ? parseFloat(weight) : memoryDb.championship_participants[idx].weight,
      target_medal: target_medal !== undefined ? target_medal : memoryDb.championship_participants[idx].target_medal,
      medal: medal !== undefined ? medal : memoryDb.championship_participants[idx].medal
    };
  } else {
    await pool.query(`
      UPDATE championship_participants 
      SET championship_id = ?, member_id = ?, match_number = ?, category = ?, class_id = ?, belt_id = ?, weight = ?, target_medal = ?, medal = ?
      WHERE id = ?
    `, [parseInt(championship_id), parseInt(member_id), match_number || '', category, class_id ? parseInt(class_id) : null, belt_id ? parseInt(belt_id) : null, parseFloat(weight), target_medal, medal || null, id]);
  }
  res.json({ success: true, message: 'Participant updated' });
});

app.delete('/api/championships/participants/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  if (useMemoryDb) {
    memoryDb.championship_participants = memoryDb.championship_participants.filter(p => p.id !== id);
  } else {
    await pool.query('DELETE FROM championship_participants WHERE id = ?', [id]);
  }
  res.json({ success: true, message: 'Participant deleted' });
});

// Record weigh-in for participant
app.post('/api/championships/participants/:id/weigh-in', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  const id = parseInt(req.params.id);
  const { weigh_in_weight } = req.body;

  if (weigh_in_weight === undefined || weigh_in_weight === '') {
    return res.status(400).json({ success: false, message: 'weigh_in_weight is required' });
  }

  const actWeight = parseFloat(weigh_in_weight);

  let participant = null;
  let tClass = null;

  if (useMemoryDb) {
    participant = memoryDb.championship_participants.find(p => p.id === id);
    if (participant && participant.class_id) {
      tClass = memoryDb.championship_classes.find(c => c.id === participant.class_id);
    }
  } else {
    const [rows] = await pool.query('SELECT * FROM championship_participants WHERE id = ?', [id]);
    if (rows.length > 0) {
      participant = rows[0];
      if (participant.class_id) {
        const [cRows] = await pool.query('SELECT * FROM championship_classes WHERE id = ?', [participant.class_id]);
        if (cRows.length > 0) tClass = cRows[0];
      }
    }
  }

  if (!participant) {
    return res.status(404).json({ success: false, message: 'Participant not found' });
  }

  let status = 'passed';
  if (tClass) {
    const minW = parseFloat(tClass.min_weight || 0.00);
    const maxW = parseFloat(tClass.max_weight || 999.99);

    if (actWeight > maxW) {
      status = 'overweight';
    } else if (actWeight < minW) {
      status = 'underweight';
    }
  }

  if (useMemoryDb) {
    const idx = memoryDb.championship_participants.findIndex(p => p.id === id);
    memoryDb.championship_participants[idx].weigh_in_weight = actWeight;
    memoryDb.championship_participants[idx].weigh_in_status = status;
  } else {
    await pool.query(`
      UPDATE championship_participants 
      SET weigh_in_weight = ?, weigh_in_status = ? 
      WHERE id = ?
    `, [actWeight, status, id]);
  }

  res.json({ 
    success: true, 
    message: 'Data timbang berhasil dicatat!', 
    data: { 
      weigh_in_weight: actWeight, 
      weigh_in_status: status 
    } 
  });
});


// BACKUP & RESTORE DATABASE (Exports SQL or JSON, allows loading imports)
app.get('/api/backup/json', authenticateToken, checkRole(['super_admin']), (req, res) => {
  const dataStr = JSON.stringify(memoryDb, null, 2);
  res.setHeader('Content-disposition', 'attachment; filename=tms_backup.json');
  res.setHeader('Content-type', 'application/json');
  res.write(dataStr);
  res.end();
});

app.get('/api/backup/sql', authenticateToken, checkRole(['super_admin']), async (req, res) => {
  // If memory DB fallback is in use, construct mock SQL text insert file
  let sqlText = `-- TMS Database SQL Dump\n-- Generated in-memory\n\n`;
  for (const table of Object.keys(memoryDb)) {
    sqlText += `-- Table: ${table}\n`;
    const rows = memoryDb[table];
    if (rows.length === 0) continue;
    
    const columns = Object.keys(rows[0]).join(', ');
    rows.forEach(row => {
      const values = Object.values(row).map(val => {
        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        return `'${String(val).replace(/'/g, "\\'")}'`;
      }).join(', ');
      sqlText += `INSERT INTO \`${table}\` (${columns}) VALUES (${values});\n`;
    });
    sqlText += `\n`;
  }

  res.setHeader('Content-disposition', 'attachment; filename=tms_backup.sql');
  res.setHeader('Content-type', 'text/sql');
  res.write(sqlText);
  res.end();
});

app.post('/api/restore/json', authenticateToken, checkRole(['super_admin']), upload.single('backup_file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  try {
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const parsed = JSON.parse(fileContent);
    
    // Apply parsed values to memory db keys
    for (const key of Object.keys(parsed)) {
      if (memoryDb[key]) {
        memoryDb[key] = parsed[key];
      }
    }

    res.json({ success: true, message: 'Database restored successfully from JSON' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Restore failed: ' + err.message });
  }
});


// NEW ENDPOINTS: DUES BILLING & TRAINING SESSIONS

// 1. Get unpaid dues billing report
app.get('/api/dues/unpaid', authenticateToken, async (req, res) => {
  try {
    let defaultAmount = 85000;
    if (useMemoryDb) {
      const settings = memoryDb.app_settings[0];
      if (settings && settings.default_dues_amount !== undefined) {
        defaultAmount = parseFloat(settings.default_dues_amount);
      }
    } else {
      const [settingsRows] = await pool.query('SELECT default_dues_amount FROM app_settings WHERE id = 1');
      if (settingsRows.length > 0 && settingsRows[0].default_dues_amount !== null) {
        defaultAmount = parseFloat(settingsRows[0].default_dues_amount);
      }
    }

    let allMembers = [];
    if (useMemoryDb) {
      allMembers = memoryDb.members.filter(m => m.status === 'aktif');
    } else {
      [allMembers] = await pool.query('SELECT id, name, member_number, joined_date, status, dojang FROM members WHERE status = "aktif"');
    }

    let paidDues = [];
    if (useMemoryDb) {
      paidDues = memoryDb.dues.filter(d => d.status === 'sudah_bayar');
    } else {
      [paidDues] = await pool.query('SELECT member_id, month, year, amount FROM dues WHERE status = "sudah_bayar"');
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12

    const result = allMembers.map(member => {
      const joined = member.joined_date ? new Date(member.joined_date) : new Date(2026, 0, 1);
      const startYear = joined.getFullYear();
      const startMonth = joined.getMonth() + 1;

      const unpaid = [];
      let y = startYear;
      let m = startMonth;

      while (y < currentYear || (y === currentYear && m <= currentMonth)) {
        const isPaid = paidDues.some(d => d.member_id === member.id && d.month === m && d.year === y);
        if (!isPaid) {
          unpaid.push({ month: m, year: y });
        }
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }

      return {
        member_id: member.id,
        member_name: member.name,
        member_number: member.member_number,
        dojang: member.dojang,
        unpaid_months: unpaid,
        total_unpaid: unpaid.length,
        total_bill: unpaid.length * defaultAmount
      };
    });

    const unpaidMembers = result.filter(r => r.total_unpaid > 0);

    res.json({
      success: true,
      data: unpaidMembers,
      default_dues_amount: defaultAmount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error calculating unpaid dues' });
  }
});

// 2. GET all sessions
app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    let sessions = [];
    if (useMemoryDb) {
      sessions = memoryDb.training_sessions.map(s => {
        const items = memoryDb.training_session_items.filter(item => item.session_id === s.id);
        return { ...s, items: items.sort((a, b) => a.order_index - b.order_index) };
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      [sessions] = await pool.query('SELECT * FROM training_sessions ORDER BY date DESC, id DESC');
      for (const s of sessions) {
        const [items] = await pool.query('SELECT * FROM training_session_items WHERE session_id = ? ORDER BY order_index ASC', [s.id]);
        s.items = items;
      }
    }
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching sessions' });
  }
});

// 3. POST create session
app.post('/api/sessions', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const { program_name, date, items } = req.body;
    if (!program_name || !date) {
      return res.status(400).json({ success: false, message: 'Program name and date are required' });
    }

    const parsedItems = Array.isArray(items) ? items : JSON.parse(items || '[]');
    const totalDuration = parsedItems.reduce((acc, item) => acc + parseInt(item.duration || 0), 0);

    if (useMemoryDb) {
      const sessionId = memoryDb.training_sessions.length + 1;
      const newSession = {
        id: sessionId,
        program_name,
        date,
        total_duration: totalDuration,
        created_at: new Date().toISOString()
      };
      memoryDb.training_sessions.push(newSession);
      parsedItems.forEach((item, idx) => {
        memoryDb.training_session_items.push({
          id: memoryDb.training_session_items.length + 1,
          session_id: sessionId,
          program_id: item.program_id || null,
          name: item.name,
          description: item.description || '',
          duration: parseInt(item.duration || 0),
          order_index: idx
        });
      });
      res.json({ success: true, message: 'Session created successfully', data: { ...newSession, items: parsedItems } });
    } else {
      const [resSession] = await pool.query(
        'INSERT INTO training_sessions (program_name, date, total_duration) VALUES (?, ?, ?)',
        [program_name, date, totalDuration]
      );
      const sessionId = resSession.insertId;
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        await pool.query(
          'INSERT INTO training_session_items (session_id, program_id, name, description, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [sessionId, item.program_id || null, item.name, item.description || '', parseInt(item.duration || 0), i]
        );
      }
      res.json({ success: true, message: 'Session created successfully', data: { id: sessionId, program_name, date, total_duration: totalDuration } });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error creating session' });
  }
});

// 4. PUT update session
app.put('/api/sessions/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { program_name, date, items } = req.body;
    if (!program_name || !date) {
      return res.status(400).json({ success: false, message: 'Program name and date are required' });
    }

    const parsedItems = Array.isArray(items) ? items : JSON.parse(items || '[]');
    const totalDuration = parsedItems.reduce((acc, item) => acc + parseInt(item.duration || 0), 0);

    if (useMemoryDb) {
      const idx = memoryDb.training_sessions.findIndex(s => s.id === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
      memoryDb.training_sessions[idx] = { ...memoryDb.training_sessions[idx], program_name, date, total_duration: totalDuration };
      memoryDb.training_session_items = memoryDb.training_session_items.filter(item => item.session_id !== id);
      parsedItems.forEach((item, i) => {
        memoryDb.training_session_items.push({
          id: memoryDb.training_session_items.length + 1,
          session_id: id,
          program_id: item.program_id || null,
          name: item.name,
          description: item.description || '',
          duration: parseInt(item.duration || 0),
          order_index: i
        });
      });
      res.json({ success: true, message: 'Session updated successfully' });
    } else {
      const [resCheck] = await pool.query('SELECT id FROM training_sessions WHERE id = ?', [id]);
      if (resCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }
      await pool.query(
        'UPDATE training_sessions SET program_name = ?, date = ?, total_duration = ? WHERE id = ?',
        [program_name, date, totalDuration, id]
      );
      await pool.query('DELETE FROM training_session_items WHERE session_id = ?', [id]);
      for (let i = 0; i < parsedItems.length; i++) {
        const item = parsedItems[i];
        await pool.query(
          'INSERT INTO training_session_items (session_id, program_id, name, description, duration, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [id, item.program_id || null, item.name, item.description || '', parseInt(item.duration || 0), i]
        );
      }
      res.json({ success: true, message: 'Session updated successfully' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating session' });
  }
});

// 5. DELETE session
app.delete('/api/sessions/:id', authenticateToken, checkRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (useMemoryDb) {
      memoryDb.training_sessions = memoryDb.training_sessions.filter(s => s.id !== id);
      memoryDb.training_session_items = memoryDb.training_session_items.filter(item => item.session_id !== id);
    } else {
      await pool.query('DELETE FROM training_sessions WHERE id = ?', [id]);
    }
    res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error deleting session' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Taekwondo Management System (TMS) Backend listening on port ${PORT}`);
});
