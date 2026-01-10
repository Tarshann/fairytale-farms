CREATE TABLE `deliveryZones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zipCode` varchar(10) NOT NULL,
	`city` varchar(100),
	`state` varchar(2),
	`isActive` boolean NOT NULL DEFAULT true,
	`deliveryFee` decimal(10,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliveryZones_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliveryZones_zipCode_unique` UNIQUE(`zipCode`)
);
--> statement-breakpoint
CREATE TABLE `photoUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`userId` int NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`status` enum('pending_review','approved','rejected') NOT NULL DEFAULT 'pending_review',
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `photoUploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promoCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('percentage','fixed_amount') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`minOrderAmount` decimal(10,2),
	`maxUses` int,
	`usedCount` int NOT NULL DEFAULT 0,
	`validFrom` timestamp NOT NULL,
	`validUntil` timestamp NOT NULL,
	`applicableProductTypes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promoCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `promoCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryZipCode` varchar(10);--> statement-breakpoint
ALTER TABLE `orders` ADD `scheduledDeliveryDate` timestamp;--> statement-breakpoint
ALTER TABLE `orders` ADD `deliveryType` enum('same_day','scheduled') DEFAULT 'same_day';--> statement-breakpoint
ALTER TABLE `orders` ADD `depositPaid` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `depositAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `orders` ADD `remainingAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `orders` ADD `remainingCharged` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `promoCode` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `discountAmount` decimal(10,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `products` ADD `inventoryCap` int;--> statement-breakpoint
ALTER TABLE `products` ADD `inventorySold` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `availableFrom` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD `availableUntil` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD `requiresPhotoUpload` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `requiresDeposit` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `depositPercentage` int DEFAULT 50;--> statement-breakpoint
ALTER TABLE `products` ADD `productType` enum('standard','tier','build_your_own_item','custom_portrait') DEFAULT 'standard' NOT NULL;