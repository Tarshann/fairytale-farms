-- Add visible column to categories so admin can hide categories from the storefront
ALTER TABLE `categories` ADD COLUMN `visible` boolean NOT NULL DEFAULT true;

-- Hide Classic Cookies and Mini Tin Cakes by default (admin can re-enable in Settings)
UPDATE `categories` SET `visible` = false WHERE `slug` IN ('classic-cookies', 'mini-tin-cakes');
