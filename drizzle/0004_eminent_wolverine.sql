CREATE TABLE `chatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(100) NOT NULL,
	`inquiryId` int,
	`role` enum('user','assistant') NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customOrderInquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`inquiryNumber` varchar(50) NOT NULL,
	`customerName` varchar(200),
	`customerEmail` varchar(320),
	`customerPhone` varchar(50),
	`eventDate` timestamp,
	`eventType` varchar(100),
	`quantity` text,
	`flavorPreferences` text,
	`designTheme` text,
	`budgetRange` varchar(100),
	`estimatedPrice` varchar(50),
	`estimateDetails` text,
	`additionalNotes` text,
	`status` enum('new','contacted','quoted','confirmed','completed','cancelled') NOT NULL DEFAULT 'new',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customOrderInquiries_id` PRIMARY KEY(`id`),
	CONSTRAINT `customOrderInquiries_inquiryNumber_unique` UNIQUE(`inquiryNumber`)
);
