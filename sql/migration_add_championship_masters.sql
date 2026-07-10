-- 1. Master Table: Kategori Tanding (Kyorugi, Poomsae, dll)
CREATE TABLE IF NOT EXISTS `championship_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Categories
INSERT IGNORE INTO `championship_categories` (`name`) VALUES 
('Kyorugi'),
('Poomsae'),
('Freestyle Poomsae');

-- 2. Master Table: Golongan Usia (Pracadet, Cadet, Junior, Senior)
CREATE TABLE IF NOT EXISTS `championship_age_groups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Default Age Groups
INSERT IGNORE INTO `championship_age_groups` (`name`) VALUES 
('Pracadet A'),
('Pracadet B'),
('Pracadet C'),
('Cadet'),
('Junior'),
('Senior');

-- 3. Table: Weigh-in History
CREATE TABLE IF NOT EXISTS `weigh_in_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `participant_id` INT NOT NULL,
  `weight` DECIMAL(5,2) NOT NULL,
  `status` ENUM('lolos', 'overweight', 'underweight') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`participant_id`) REFERENCES `championship_participants`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
