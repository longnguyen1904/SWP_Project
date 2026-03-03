CREATE DATABASE  IF NOT EXISTS `TALLT_SoftwareMarket` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `TALLT_SoftwareMarket`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: TALLT_SoftwareMarket
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Categories`
--

DROP TABLE IF EXISTS `Categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Categories` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `CategoryName` (`CategoryName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Categories`
--

LOCK TABLES `Categories` WRITE;
/*!40000 ALTER TABLE `Categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `Categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LicenseActivations`
--

DROP TABLE IF EXISTS `LicenseActivations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LicenseActivations` (
  `ActivationID` int NOT NULL AUTO_INCREMENT,
  `LicenseID` int NOT NULL,
  `DeviceIdentifier` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DeviceName` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IPAddress` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ActivatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ActivationID`),
  KEY `LicenseID` (`LicenseID`),
  CONSTRAINT `LicenseActivations_ibfk_1` FOREIGN KEY (`LicenseID`) REFERENCES `Licenses` (`LicenseID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LicenseActivations`
--

LOCK TABLES `LicenseActivations` WRITE;
/*!40000 ALTER TABLE `LicenseActivations` DISABLE KEYS */;
/*!40000 ALTER TABLE `LicenseActivations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LicenseTiers`
--

DROP TABLE IF EXISTS `LicenseTiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LicenseTiers` (
  `TierID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `TierName` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Price` decimal(10,2) DEFAULT NULL,
  `MaxDevices` int DEFAULT NULL,
  `DurationDays` int DEFAULT NULL,
  `Content` longtext COLLATE utf8mb4_unicode_ci,
  `TierCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`TierID`),
  KEY `ProductID` (`ProductID`),
  CONSTRAINT `LicenseTiers_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LicenseTiers`
--

LOCK TABLES `LicenseTiers` WRITE;
/*!40000 ALTER TABLE `LicenseTiers` DISABLE KEYS */;
/*!40000 ALTER TABLE `LicenseTiers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Licenses`
--

DROP TABLE IF EXISTS `Licenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Licenses` (
  `LicenseID` int NOT NULL AUTO_INCREMENT,
  `LicenseKey` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `OrderID` int NOT NULL,
  `UserID` int NOT NULL,
  `ProductID` int NOT NULL,
  `TierID` int NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `IsTrial` tinyint(1) DEFAULT '0',
  `ExpireAt` datetime DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `IsDeleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`LicenseID`),
  UNIQUE KEY `LicenseKey` (`LicenseKey`),
  UNIQUE KEY `OrderID` (`OrderID`),
  KEY `Licenses_User_FK` (`UserID`),
  KEY `Licenses_Product_FK` (`ProductID`),
  KEY `Licenses_Tier_FK` (`TierID`),
  CONSTRAINT `Licenses_Order_FK` FOREIGN KEY (`OrderID`) REFERENCES `Orders` (`OrderID`),
  CONSTRAINT `Licenses_Product_FK` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`),
  CONSTRAINT `Licenses_Tier_FK` FOREIGN KEY (`TierID`) REFERENCES `LicenseTiers` (`TierID`),
  CONSTRAINT `Licenses_User_FK` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Licenses`
--

LOCK TABLES `Licenses` WRITE;
/*!40000 ALTER TABLE `Licenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `Licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Orders`
--

DROP TABLE IF EXISTS `Orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Orders` (
  `OrderID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `ProductID` int NOT NULL,
  `TierID` int NOT NULL,
  `Quantity` int DEFAULT '1',
  `UnitPrice` decimal(10,2) NOT NULL,
  `DiscountAmount` decimal(10,2) DEFAULT '0.00',
  `TotalAmount` decimal(10,2) NOT NULL,
  `PaymentMethod` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'VNPay',
  `PaymentStatus` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `TransactionRef` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`OrderID`),
  KEY `UserID` (`UserID`),
  KEY `ProductID` (`ProductID`),
  KEY `TierID` (`TierID`),
  CONSTRAINT `Orders_Product_FK` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`),
  CONSTRAINT `Orders_Tier_FK` FOREIGN KEY (`TierID`) REFERENCES `LicenseTiers` (`TierID`),
  CONSTRAINT `Orders_User_FK` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Orders`
--

LOCK TABLES `Orders` WRITE;
/*!40000 ALTER TABLE `Orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `Orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PlatformCommission`
--

DROP TABLE IF EXISTS `PlatformCommission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlatformCommission` (
  `CommissionID` int NOT NULL AUTO_INCREMENT,
  `Percentage` decimal(5,2) DEFAULT NULL,
  `EffectiveFrom` datetime DEFAULT NULL,
  PRIMARY KEY (`CommissionID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PlatformCommission`
--

LOCK TABLES `PlatformCommission` WRITE;
/*!40000 ALTER TABLE `PlatformCommission` DISABLE KEYS */;
/*!40000 ALTER TABLE `PlatformCommission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ProductImages`
--

DROP TABLE IF EXISTS `ProductImages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ProductImages` (
  `ImageID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `ImageUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ImageType` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'SCREENSHOT',
  `SortOrder` int DEFAULT '0',
  `IsPrimary` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ImageID`),
  KEY `ProductID` (`ProductID`),
  CONSTRAINT `ProductImages_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductImages`
--

LOCK TABLES `ProductImages` WRITE;
/*!40000 ALTER TABLE `ProductImages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ProductImages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ProductTags`
--

DROP TABLE IF EXISTS `ProductTags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ProductTags` (
  `ProductID` int NOT NULL,
  `TagID` int NOT NULL,
  PRIMARY KEY (`ProductID`,`TagID`),
  KEY `TagID` (`TagID`),
  CONSTRAINT `ProductTags_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`) ON DELETE CASCADE,
  CONSTRAINT `ProductTags_ibfk_2` FOREIGN KEY (`TagID`) REFERENCES `Tags` (`TagID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductTags`
--

LOCK TABLES `ProductTags` WRITE;
/*!40000 ALTER TABLE `ProductTags` DISABLE KEYS */;
/*!40000 ALTER TABLE `ProductTags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ProductVersions`
--

DROP TABLE IF EXISTS `ProductVersions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ProductVersions` (
  `VersionID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `VersionNumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FileUrl` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ReleaseNotes` longtext COLLATE utf8mb4_unicode_ci,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`VersionID`),
  KEY `ProductID` (`ProductID`),
  CONSTRAINT `ProductVersions_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductVersions`
--

LOCK TABLES `ProductVersions` WRITE;
/*!40000 ALTER TABLE `ProductVersions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ProductVersions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Products`
--

DROP TABLE IF EXISTS `Products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Products` (
  `ProductID` int NOT NULL AUTO_INCREMENT,
  `VendorID` int NOT NULL,
  `CategoryID` int NOT NULL,
  `ProductName` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Description` longtext COLLATE utf8mb4_unicode_ci,
  `BasePrice` decimal(10,2) DEFAULT NULL,
  `IsApproved` tinyint(1) DEFAULT '0',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `HasTrial` tinyint(1) DEFAULT '0',
  `TrialDurationDays` int DEFAULT '7',
  PRIMARY KEY (`ProductID`),
  KEY `VendorID` (`VendorID`),
  KEY `CategoryID` (`CategoryID`),
  CONSTRAINT `Products_ibfk_1` FOREIGN KEY (`VendorID`) REFERENCES `Vendors` (`VendorID`),
  CONSTRAINT `Products_ibfk_2` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Products`
--

LOCK TABLES `Products` WRITE;
/*!40000 ALTER TABLE `Products` DISABLE KEYS */;
/*!40000 ALTER TABLE `Products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Reviews`
--

DROP TABLE IF EXISTS `Reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reviews` (
  `ReviewID` int NOT NULL AUTO_INCREMENT,
  `ProductID` int NOT NULL,
  `UserID` int NOT NULL,
  `Rating` int DEFAULT NULL,
  `Comment` longtext COLLATE utf8mb4_unicode_ci,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReviewID`),
  KEY `ProductID` (`ProductID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `Reviews_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`),
  CONSTRAINT `Reviews_ibfk_2` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `Reviews_chk_1` CHECK ((`Rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reviews`
--

LOCK TABLES `Reviews` WRITE;
/*!40000 ALTER TABLE `Reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `Reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Roles`
--

DROP TABLE IF EXISTS `Roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Roles` (
  `RoleID` int NOT NULL,
  `RoleName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Roles`
--

LOCK TABLES `Roles` WRITE;
/*!40000 ALTER TABLE `Roles` DISABLE KEYS */;
INSERT INTO `Roles` VALUES (1,'Admin'),(2,'Vendor'),(3,'Customer');
/*!40000 ALTER TABLE `Roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SupportTickets`
--

DROP TABLE IF EXISTS `SupportTickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SupportTickets` (
  `TicketID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `VendorID` int NOT NULL,
  `OrderID` int DEFAULT NULL,
  `Subject` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Description` longtext COLLATE utf8mb4_unicode_ci,
  `Status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Open',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TicketID`),
  KEY `UserID` (`UserID`),
  KEY `VendorID` (`VendorID`),
  KEY `OrderID` (`OrderID`),
  CONSTRAINT `SupportTickets_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `SupportTickets_ibfk_2` FOREIGN KEY (`VendorID`) REFERENCES `Vendors` (`VendorID`),
  CONSTRAINT `SupportTickets_ibfk_3` FOREIGN KEY (`OrderID`) REFERENCES `Orders` (`OrderID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SupportTickets`
--

LOCK TABLES `SupportTickets` WRITE;
/*!40000 ALTER TABLE `SupportTickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `SupportTickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Tags`
--

DROP TABLE IF EXISTS `Tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tags` (
  `TagID` int NOT NULL AUTO_INCREMENT,
  `TagName` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`TagID`),
  UNIQUE KEY `TagName` (`TagName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tags`
--

LOCK TABLES `Tags` WRITE;
/*!40000 ALTER TABLE `Tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `Tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `TicketMessages`
--

DROP TABLE IF EXISTS `TicketMessages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `TicketMessages` (
  `MessageID` int NOT NULL AUTO_INCREMENT,
  `TicketID` int NOT NULL,
  `SenderID` int NOT NULL,
  `MessageContent` longtext COLLATE utf8mb4_unicode_ci,
  `AttachmentUrl` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MessageID`),
  KEY `TicketID` (`TicketID`),
  KEY `SenderID` (`SenderID`),
  CONSTRAINT `TicketMessages_ibfk_1` FOREIGN KEY (`TicketID`) REFERENCES `SupportTickets` (`TicketID`),
  CONSTRAINT `TicketMessages_ibfk_2` FOREIGN KEY (`SenderID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `TicketMessages`
--

LOCK TABLES `TicketMessages` WRITE;
/*!40000 ALTER TABLE `TicketMessages` DISABLE KEYS */;
/*!40000 ALTER TABLE `TicketMessages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FullName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RoleID` int NOT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `Username` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `Email` (`Email`),
  UNIQUE KEY `Username` (`Username`),
  KEY `RoleID` (`RoleID`),
  CONSTRAINT `Users_ibfk_1` FOREIGN KEY (`RoleID`) REFERENCES `Roles` (`RoleID`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'dinhlam728@gmail.com','123456','Trinh Dinh Lam',3,1,'2026-01-25 07:37:24','dinhlam728'),(2,'lamtd@gmail.com','$2a$10$Ov6U6fQTeKTY2coQ7LS7GedfiyBx3btSgt01SW19YwFEzYhvDFpD2','Dinh Lam Trinh',3,1,'2026-02-02 10:09:35','lamtd');
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `VendorPayouts`
--

DROP TABLE IF EXISTS `VendorPayouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `VendorPayouts` (
  `PayoutID` int NOT NULL AUTO_INCREMENT,
  `VendorID` int NOT NULL,
  `Amount` decimal(10,2) DEFAULT NULL,
  `PayoutDate` datetime DEFAULT NULL,
  `Status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`PayoutID`),
  KEY `VendorID` (`VendorID`),
  CONSTRAINT `VendorPayouts_ibfk_1` FOREIGN KEY (`VendorID`) REFERENCES `Vendors` (`VendorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `VendorPayouts`
--

LOCK TABLES `VendorPayouts` WRITE;
/*!40000 ALTER TABLE `VendorPayouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `VendorPayouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Vendors`
--

DROP TABLE IF EXISTS `Vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vendors` (
  `VendorID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `CompanyName` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdentificationDoc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IsVerified` tinyint(1) DEFAULT '0',
  `VerifiedAt` datetime DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `Type` enum('INDIVIDUAL','COMPANY') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INDIVIDUAL',
  `TaxCode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CitizenID` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`VendorID`),
  UNIQUE KEY `UserID` (`UserID`),
  CONSTRAINT `Vendors_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vendors`
--

LOCK TABLES `Vendors` WRITE;
/*!40000 ALTER TABLE `Vendors` DISABLE KEYS */;
/*!40000 ALTER TABLE `Vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WalletTransactions`
--

DROP TABLE IF EXISTS `WalletTransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `WalletTransactions` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `WalletID` int NOT NULL,
  `Amount` decimal(15,2) NOT NULL,
  `Type` enum('DEPOSIT','WITHDRAWAL','SALE_REVENUE','COMMISSION_FEE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ReferenceID` int DEFAULT NULL,
  `Description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`TransactionID`),
  KEY `WalletID` (`WalletID`),
  CONSTRAINT `WalletTransactions_Wallet_FK` FOREIGN KEY (`WalletID`) REFERENCES `Wallets` (`WalletID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WalletTransactions`
--

LOCK TABLES `WalletTransactions` WRITE;
/*!40000 ALTER TABLE `WalletTransactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `WalletTransactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Wallets`
--

DROP TABLE IF EXISTS `Wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Wallets` (
  `WalletID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `Balance` decimal(15,2) DEFAULT '0.00',
  `UpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`WalletID`),
  UNIQUE KEY `UserID` (`UserID`),
  CONSTRAINT `Wallets_User_FK` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Wallets`
--

LOCK TABLES `Wallets` WRITE;
/*!40000 ALTER TABLE `Wallets` DISABLE KEYS */;
/*!40000 ALTER TABLE `Wallets` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-04 18:34:52
