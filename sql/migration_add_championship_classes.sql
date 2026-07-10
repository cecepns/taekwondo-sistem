-- Migration file: Add championship classes master table and participant weigh-in columns

USE `taekwondo_tms`;

-- 1. Create championship_classes Master Table
CREATE TABLE IF NOT EXISTS `championship_classes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL,       -- e.g., 'Kyorugi' (Tanding), 'Poomsae' (Festival)
  `age_group` VARCHAR(50) NOT NULL,      -- e.g., 'Pracadet A', 'Pracadet B', 'Cadet', 'Junior', 'Senior'
  `gender` ENUM('L', 'P', 'Semua') DEFAULT 'Semua',
  `class_name` VARCHAR(50) NOT NULL,     -- e.g., 'Under 22kg', 'Under 24kg', 'Under 26kg'
  `min_weight` DECIMAL(5,2) DEFAULT 0.00,
  `max_weight` DECIMAL(5,2) DEFAULT 999.99,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Seed Default Classes
INSERT INTO `championship_classes` (`category`, `age_group`, `gender`, `class_name`, `min_weight`, `max_weight`) VALUES
('Kyorugi', 'Pracadet A', 'Semua', 'Under 22kg', 0.00, 22.00),
('Kyorugi', 'Pracadet A', 'Semua', 'Under 24kg', 22.01, 24.00),
('Kyorugi', 'Pracadet A', 'Semua', 'Under 26kg', 24.01, 26.00),
('Kyorugi', 'Pracadet A', 'Semua', 'Under 28kg', 26.01, 28.00),
('Kyorugi', 'Pracadet B', 'Semua', 'Under 26kg', 0.00, 26.00),
('Kyorugi', 'Pracadet B', 'Semua', 'Under 28kg', 26.01, 28.00),
('Kyorugi', 'Pracadet B', 'Semua', 'Under 30kg', 28.01, 30.00),
('Kyorugi', 'Pracadet B', 'Semua', 'Under 33kg', 30.01, 33.00),
('Kyorugi', 'Cadet', 'L', 'Under 33kg', 0.00, 33.00),
('Kyorugi', 'Cadet', 'L', 'Under 37kg', 33.01, 37.00),
('Kyorugi', 'Cadet', 'L', 'Under 41kg', 37.01, 41.00),
('Kyorugi', 'Cadet', 'L', 'Under 45kg', 41.01, 45.00),
('Kyorugi', 'Cadet', 'P', 'Under 33kg', 0.00, 33.00),
('Kyorugi', 'Cadet', 'P', 'Under 37kg', 33.01, 37.00),
('Kyorugi', 'Cadet', 'P', 'Under 41kg', 37.01, 41.00),
('Kyorugi', 'Cadet', 'P', 'Under 44kg', 41.01, 44.00),
('Kyorugi', 'Junior', 'L', 'Under 45kg', 0.00, 45.00),
('Kyorugi', 'Junior', 'L', 'Under 48kg', 45.01, 48.00),
('Kyorugi', 'Junior', 'L', 'Under 51kg', 48.01, 51.00),
('Kyorugi', 'Junior', 'L', 'Under 55kg', 51.01, 55.00),
('Kyorugi', 'Junior', 'P', 'Under 42kg', 0.00, 42.00),
('Kyorugi', 'Junior', 'P', 'Under 44kg', 42.01, 44.00),
('Kyorugi', 'Senior', 'L', 'Under 54kg', 0.00, 54.00),
('Kyorugi', 'Senior', 'L', 'Under 58kg', 54.01, 58.00),
('Kyorugi', 'Senior', 'L', 'Under 63kg', 58.01, 63.00),
('Kyorugi', 'Senior', 'L', 'Under 68kg', 63.01, 68.00);

-- 3. Add class_id, weigh_in_weight, and weigh_in_status columns to championship_participants
ALTER TABLE `championship_participants` 
ADD COLUMN `class_id` INT NULL AFTER `category`,
ADD COLUMN `weigh_in_weight` DECIMAL(5,2) DEFAULT NULL AFTER `weight`,
ADD COLUMN `weigh_in_status` ENUM('passed', 'overweight', 'underweight', 'unweighed') DEFAULT 'unweighed' AFTER `weigh_in_weight`,
ADD FOREIGN KEY (`class_id`) REFERENCES `championship_classes`(`id`) ON DELETE SET NULL;
