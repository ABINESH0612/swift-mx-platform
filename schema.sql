-- ==============================================================
-- SWIFT MX Message Processing Database Schema
-- Target Database: MySQL 8.0+
-- Database Name: swift_mx_db
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `swift_mx_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `swift_mx_db`;

-- Drop existing table if fresh setup is desired
-- DROP TABLE IF EXISTS `swift_messages`;

CREATE TABLE IF NOT EXISTS `swift_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `message_type` VARCHAR(50) DEFAULT NULL COMMENT 'ISO 20022 message definition identifier (e.g. pacs.008.001.08)',
  `message_id` VARCHAR(100) DEFAULT NULL COMMENT 'Group header or business message ID',
  `sender` VARCHAR(150) DEFAULT NULL COMMENT 'Sender institution BIC or Debtor Name',
  `receiver` VARCHAR(150) DEFAULT NULL COMMENT 'Receiver institution BIC or Creditor Name',
  `creation_date` VARCHAR(50) DEFAULT NULL COMMENT 'Message creation timestamp string',
  `amount` DECIMAL(20,5) DEFAULT NULL COMMENT 'Interbank settlement or instructed amount',
  `currency` VARCHAR(10) DEFAULT NULL COMMENT 'ISO 4217 Currency Code (e.g. EUR, USD, GBP)',
  `transaction_reference` VARCHAR(100) DEFAULT NULL COMMENT 'EndToEndId or Transaction Reference',
  `original_xml` LONGTEXT NOT NULL COMMENT 'Full original ISO 20022 XML payload',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Audit timestamp of database insertion',
  PRIMARY KEY (`id`),
  INDEX `idx_message_id` (`message_id`),
  INDEX `idx_tx_ref` (`transaction_reference`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
