-- Migration: Make birth_date column nullable in members table
ALTER TABLE `members` MODIFY `birth_date` DATE NULL;
