-- Migration file to update Taekwondo Management System database

USE `taekwondo_tms`;

-- 1. Add default_dues_amount column to app_settings table
ALTER TABLE `app_settings` 
ADD COLUMN `default_dues_amount` DECIMAL(12,2) DEFAULT 85000.00 AFTER `footer_text`;

-- 2. Create training_sessions Table
CREATE TABLE IF NOT EXISTS `training_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `program_name` VARCHAR(150) NOT NULL,
  `date` DATE NOT NULL,
  `total_duration` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Create training_session_items Table
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
