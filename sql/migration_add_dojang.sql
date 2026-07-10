-- Migration file: Add dojang column to members table

USE `taekwondo_tms`;

-- 1. Add dojang column to members table
ALTER TABLE `members` 
ADD COLUMN `dojang` VARCHAR(100) DEFAULT NULL AFTER `school`;

-- 2. Extract dojang info from notes for existing records (e.g. "Dojang: CITAPEN")
UPDATE `members` 
SET `dojang` = SUBSTRING(`notes`, 9) 
WHERE `notes` LIKE 'Dojang: %' AND (`dojang` IS NULL OR `dojang` = '');
