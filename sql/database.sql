-- MySQL Database Schema for Taekwondo Management System (TMS)

CREATE DATABASE IF NOT EXISTS `taekwondo_tms`;
USE `taekwondo_tms`;

-- 1. App Settings Table
CREATE TABLE IF NOT EXISTS `app_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `app_name` VARCHAR(100) DEFAULT 'Taekwondo Club Management',
  `dojang_name` VARCHAR(100) DEFAULT 'Dojang Taekwondo Indonesia',
  `address` TEXT,
  `whatsapp` VARCHAR(20) DEFAULT '',
  `email` VARCHAR(100) DEFAULT '',
  `logo` VARCHAR(255) DEFAULT '',
  `favicon` VARCHAR(255) DEFAULT '',
  `login_bg` VARCHAR(255) DEFAULT '',
  `dashboard_bg` VARCHAR(255) DEFAULT '',
  `dashboard_banner` VARCHAR(255) DEFAULT '',
  `main_color` VARCHAR(50) DEFAULT '#3b82f6', -- Tailwind blue-500
  `footer_text` VARCHAR(255) DEFAULT '© 2026 Taekwondo Management System. All Rights Reserved.',
  `default_dues_amount` DECIMAL(12,2) DEFAULT 85000.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'finance') NOT NULL,
  `status` ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Belts Table (Sabuk)
CREATE TABLE IF NOT EXISTS `belts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `color` VARCHAR(50) NOT NULL,
  `order_index` INT NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Classes Table (Kelas)
CREATE TABLE IF NOT EXISTS `classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL,
  `description` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Members Table
CREATE TABLE IF NOT EXISTS `members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_number` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(100) NOT NULL,
  `photo` VARCHAR(255) DEFAULT '',
  `gender` ENUM('L', 'P') NOT NULL,
  `birth_place` VARCHAR(100) NOT NULL,
  `birth_date` DATE NOT NULL,
  `parent_name` VARCHAR(100) DEFAULT '',
  `whatsapp` VARCHAR(20) DEFAULT '',
  `school` VARCHAR(100) DEFAULT '',
  `belt_id` INT,
  `weight` DECIMAL(5,2) DEFAULT 0.00,
  `height` DECIMAL(5,2) DEFAULT 0.00,
  `blood_type` ENUM('A', 'B', 'AB', 'O', '-') DEFAULT '-',
  `address` TEXT,
  `status` ENUM('aktif', 'tidak_aktif', 'lulus', 'keluar') DEFAULT 'aktif',
  `joined_date` DATE NOT NULL,
  `notes` TEXT,
  `doc_akta` VARCHAR(255) DEFAULT '',
  `doc_kk` VARCHAR(255) DEFAULT '',
  `doc_photo` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`belt_id`) REFERENCES `belts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Member Classes Junction Table (Since members can have classes)
CREATE TABLE IF NOT EXISTS `member_classes` (
  `member_id` INT NOT NULL,
  `class_id` INT NOT NULL,
  PRIMARY KEY (`member_id`, `class_id`),
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Coaches Table (Pelatih)
CREATE TABLE IF NOT EXISTS `coaches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `photo` VARCHAR(255) DEFAULT '',
  `whatsapp` VARCHAR(20) DEFAULT '',
  `address` TEXT,
  `base_honor` DECIMAL(12,2) DEFAULT 0.00,
  `status` ENUM('aktif', 'tidak_aktif') DEFAULT 'aktif',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Coach Attendances Table (Absensi Pelatih & Honor)
CREATE TABLE IF NOT EXISTS `coach_attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `coach_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `time_in` TIME DEFAULT NULL,
  `time_out` TIME DEFAULT NULL,
  `status` ENUM('hadir', 'izin', 'sakit', 'alpha') NOT NULL,
  `honor_calculated` DECIMAL(12,2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Member Attendances Table (Absensi Anggota)
CREATE TABLE IF NOT EXISTS `member_attendances` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `class_id` INT,
  `coach_id` INT,
  `status` ENUM('hadir', 'izin', 'sakit', 'alpha') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Dues Table (Iuran)
CREATE TABLE IF NOT EXISTS `dues` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `month` INT NOT NULL, -- 1 to 12
  `year` INT NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `payment_date` DATETIME DEFAULT NULL,
  `officer_id` INT,
  `method` ENUM('cash', 'transfer', 'qris') DEFAULT 'cash',
  `status` ENUM('belum_bayar', 'sudah_bayar', 'menunggak') DEFAULT 'belum_bayar',
  `notes` TEXT,
  `attachment` VARCHAR(255) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`officer_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Training Programs Table
CREATE TABLE IF NOT EXISTS `training_programs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(50) NOT NULL, -- Tendangan, Poomsae, Sparring, Stamina, dll.
  `description` TEXT,
  `target` VARCHAR(255) DEFAULT '',
  `duration` VARCHAR(50) DEFAULT '',
  `image` VARCHAR(255) DEFAULT '',
  `video` VARCHAR(255) DEFAULT '',
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11b. Training Sessions Table
CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_name` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `total_duration` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11c. Training Session Items Table
CREATE TABLE IF NOT EXISTS `training_session_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `program_id` INT,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `duration` INT NOT NULL DEFAULT 0,
  `order_index` INT DEFAULT 0,
  FOREIGN KEY (`session_id`) REFERENCES `training_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `training_programs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. Schedules Table (Jadwal Latihan)
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `time` TIME NOT NULL,
  `coach_id` INT,
  `class_id` INT,
  `program_id` INT,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`coach_id`) REFERENCES `coaches`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`program_id`) REFERENCES `training_programs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Championships Table (Master Kejuaraan)
CREATE TABLE IF NOT EXISTS `championships` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `organizer` VARCHAR(100) NOT NULL,
  `level` ENUM('internal', 'regional', 'provinsi', 'nasional', 'internasional') NOT NULL,
  `poster` VARCHAR(255) DEFAULT '',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Championship Participants Table
CREATE TABLE IF NOT EXISTS `championship_participants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `championship_id` INT NOT NULL,
  `member_id` INT NOT NULL,
  `match_number` VARCHAR(50) DEFAULT '',
  `category` VARCHAR(100) NOT NULL, -- e.g., Under 25kg, Under 30kg, Poomsae Cadet
  `belt_id` INT,
  `weight` DECIMAL(5,2) NOT NULL,
  `target_medal` VARCHAR(50) DEFAULT '',
  `result` ENUM('juara_1', 'juara_2', 'juara_3', 'tidak_juara') DEFAULT NULL,
  `medal` ENUM('emas', 'perak', 'perunggu', 'none') DEFAULT 'none',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`championship_id`) REFERENCES `championships`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`belt_id`) REFERENCES `belts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Physical Test Types Table (Master Jenis Tes)
CREATE TABLE IF NOT EXISTS `physical_test_types` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT '', -- Speed, Agility, Flexibility, Endurance, Power
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Member Physical Targets Table
CREATE TABLE IF NOT EXISTS `member_physical_targets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `test_type_id` INT NOT NULL,
  `target_value` VARCHAR(50) NOT NULL, -- e.g., "12 detik", "40 kali"
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `member_test` (`member_id`, `test_type_id`),
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_type_id`) REFERENCES `physical_test_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. Physical Test Results Table
CREATE TABLE IF NOT EXISTS `physical_test_results` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `member_id` INT NOT NULL,
  `test_type_id` INT NOT NULL,
  `date` DATE NOT NULL,
  `target_value` VARCHAR(50) NOT NULL,
  `result_value` VARCHAR(50) NOT NULL,
  `score` DECIMAL(5,2) DEFAULT NULL, -- numeric equivalent if applicable
  `notes` TEXT,
  `status` ENUM('naik', 'turun', 'stabil') DEFAULT 'stabil',
  `evaluation` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`test_type_id`) REFERENCES `physical_test_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. Activity Logs Table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `action` VARCHAR(100) NOT NULL,
  `target` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `ip_address` VARCHAR(45) DEFAULT '',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ========================================================
-- SEED DATA
-- ========================================================

-- Seed App Settings
INSERT INTO `app_settings` (`id`, `app_name`, `dojang_name`, `address`, `whatsapp`, `email`, `footer_text`, `default_dues_amount`)
VALUES (1, 'Taekwondo Club Management', 'Dojang Taekwondo Indonesia', 'Jl. Sudirman No. 45, Jakarta Selatan', '081234567890', 'dojang@taekwondo.id', '© 2026 Taekwondo Management System. All Rights Reserved.', 85000.00);

-- Seed Users
-- The password hash here is bcrypt for 'admin123'
INSERT INTO `users` (`id`, `username`, `password_hash`, `name`, `role`, `status`)
VALUES 
(1, 'superadmin', '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', 'Super Admin TMS', 'super_admin', 'aktif'),
(2, 'admin', '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', 'Admin Dojang', 'admin', 'aktif'),
(3, 'keuangan', '$2b$10$wK1Wwz/T.U33L7cE0o67MuxgC.z81m3qI5a7/Yq9d7o/BqE4ZlF6y', 'Staff Keuangan', 'finance', 'aktif');

-- Seed Belts
INSERT INTO `belts` (`id`, `name`, `color`, `order_index`)
VALUES 
(1, 'Putih', 'white', 1),
(2, 'Kuning', 'yellow', 2),
(3, 'Kuning Strip Hijau', 'yellow-green', 3),
(4, 'Hijau', 'green', 4),
(5, 'Hijau Strip Biru', 'green-blue', 5),
(6, 'Biru', 'blue', 6),
(7, 'Biru Strip Merah', 'blue-red', 7),
(8, 'Merah', 'red', 8),
(9, 'Merah Strip Hitam 1', 'red-black1', 9),
(10, 'Merah Strip Hitam 2', 'red-black2', 10),
(11, 'Hitam (DAN 1)', 'black1', 11),
(12, 'Hitam (DAN 2)', 'black2', 12);

-- Seed Classes
INSERT INTO `classes` (`id`, `name`, `description`)
VALUES 
(1, 'Pemula', 'Kelas untuk anggota ber-sabuk Putih s/d Kuning Strip'),
(2, 'Pra Cadet', 'Kelas untuk anggota usia di bawah 11 tahun'),
(3, 'Cadet', 'Kelas untuk anggota usia 12-14 tahun'),
(4, 'Junior', 'Kelas untuk anggota usia 15-17 tahun'),
(5, 'Senior', 'Kelas untuk anggota usia 18 tahun ke atas'),
(6, 'Prestasi', 'Kelas khusus persiapan kejuaraan dan pemusatan latihan');

-- Seed Physical Test Types
INSERT INTO `physical_test_types` (`id`, `name`, `category`, `description`)
VALUES 
(1, 'Sprint 30m', 'Speed', 'Mengukur kecepatan lari jarak pendek 30 meter dalam satuan detik'),
(2, 'Push Up 1 Menit', 'Power', 'Mengukur kekuatan otot lengan dan dada dalam 1 menit'),
(3, 'Sit Up 1 Menit', 'Power', 'Mengukur kekuatan otot perut dalam 1 menit'),
(4, 'Vertical Jump', 'Power', 'Mengukur lompatan tegak lurus dalam satuan centimeter'),
(5, 'Skipping 2 Menit', 'Endurance', 'Mengukur daya tahan kardiovaskular dengan skipping dalam 2 menit'),
(6, 'Split Test', 'Flexibility', 'Mengukur kelenturan panggul dan kaki (rentang kaki)');

-- Seed Training Programs
INSERT INTO `training_programs` (`id`, `name`, `category`, `description`, `target`, `duration`, `is_active`)
VALUES 
(1, 'Latihan Tendangan (Kicking)', 'Tendangan', 'Fokus pada teknik tendangan dasar dan cepat seperti Ap Chagi, Dollyo Chagi, dan Dwi Chagi.', 'Kecepatan dan presisi tendangan', '60 menit', 1),
(2, 'Poomsae Taegeuk 1-3', 'Poomsae', 'Latihan jurus dasar Taegeuk Il Jang, Ee Jang, dan Sam Jang.', 'Akurasi gerakan dan kekuatan kuda-kuda', '45 menit', 1),
(3, 'Latihan Kelincahan Kaki (Footwork)', 'Kecepatan', 'Latihan footwork sparring menggunakan ladder drill dan cone.', 'Kelincahan bergerak saat sparring', '30 menit', 1),
(4, 'Cardio & Endurance Circuit', 'Stamina', 'Latihan sirkuit fisik: pushup, situp, jumping jack, shuttle run.', 'Daya tahan fisik bertanding', '45 menit', 1);

-- Seed Coaches
INSERT INTO `coaches` (`id`, `name`, `whatsapp`, `address`, `base_honor`, `status`)
VALUES 
(1, 'Sabeum Nim Budi', '081234567891', 'Jl. Mawar No. 12, Jakarta', 150000.00, 'aktif'),
(2, 'Sabeum Nim Andi', '081234567892', 'Jl. Melati No. 23, Jakarta', 200000.00, 'aktif');

-- Seed Members
INSERT INTO `members` (`id`, `member_number`, `name`, `gender`, `birth_place`, `birth_date`, `parent_name`, `whatsapp`, `school`, `belt_id`, `weight`, `height`, `blood_type`, `address`, `status`, `joined_date`)
VALUES 
(1, 'TMS-2026-0001', 'Fauzan Ahmad', 'L', 'Jakarta', '2012-05-15', 'Heri Ahmad', '081299998888', 'SDN 01 Pagi Jakarta', 1, 32.50, 135.00, 'O', 'Jl. Merdeka No. 10', 'aktif', '2026-01-10'),
(2, 'TMS-2026-0002', 'Siti Aminah', 'P', 'Bandung', '2010-09-20', 'Rudi Aminah', '081288887777', 'SMPN 12 Jakarta', 4, 42.00, 150.00, 'A', 'Jl. Proklamasi No. 5', 'aktif', '2026-01-15');

-- Link Members to Classes
INSERT INTO `member_classes` (`member_id`, `class_id`) VALUES (1, 2), (2, 3);
