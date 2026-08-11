CREATE DATABASE  IF NOT EXISTS `TALLT_SoftwareMarket` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `TALLT_SoftwareMarket`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: TALLT_SoftwareMarket
-- ------------------------------------------------------
-- Server version	8.0.45

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
  `CategoryName` varchar(255) NOT NULL,
  PRIMARY KEY (`CategoryID`),
  UNIQUE KEY `UKmnsxp4e5i2f5gfq1eqaw8cwm` (`CategoryName`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Categories`
--

LOCK TABLES `Categories` WRITE;
/*!40000 ALTER TABLE `Categories` DISABLE KEYS */;
INSERT INTO `Categories` VALUES (5,'Database Tools'),(3,'Design Tools'),(1,'IDE & Code Editor'),(2,'Project Management'),(4,'Security & Antivirus');
/*!40000 ALTER TABLE `Categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LicenseTiers`
--

DROP TABLE IF EXISTS `LicenseTiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LicenseTiers` (
  `TierID` int NOT NULL AUTO_INCREMENT,
  `Content` longtext,
  `DurationDays` int DEFAULT NULL,
  `MaxDevices` int DEFAULT NULL,
  `Price` decimal(38,2) DEFAULT NULL,
  `TierCode` varchar(255) DEFAULT NULL,
  `TierName` varchar(255) DEFAULT NULL,
  `ProductID` int NOT NULL,
  PRIMARY KEY (`TierID`),
  KEY `FK1ryb122myny4tuxxd3dvnlql5` (`ProductID`),
  CONSTRAINT `FK1ryb122myny4tuxxd3dvnlql5` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LicenseTiers`
--

LOCK TABLES `LicenseTiers` WRITE;
/*!40000 ALTER TABLE `LicenseTiers` DISABLE KEYS */;
INSERT INTO `LicenseTiers` VALUES (1,'1231231',365,112,12312312312.00,'12312312','123123',2),(2,'1231231',365,112,12312312312.00,'12312312','123123',2),(3,'',365,1,123123123123.00,'123123123123','123123123',3),(4,'',365,1,123123123.00,'123123123','1123123',4),(5,'123',365,1,123.00,'123','123',5),(6,'123',365,1,123.00,'1233','123',6),(7,'123',365,1,123.00,'123','123',7),(8,'123',365,1,123.00,'123','123',8),(9,'123',365,1,123.00,'123','123',9),(10,'sdcscsc',30,1,40000.00,'Basic','Basic-1 months',10),(11,'qưeqwe',365,1,20000.00,'STD','qưeqweq',11),(12,'qưeqwe',365,1,2000.00,'STD','qưeqweqw',11),(13,'',365,1,250000.00,'STD','fdsfds',12),(14,'',365,1,250000.00,'STD','svdsv',13),(15,'',60,1,240000.00,'STD','vfdsvfd',14),(16,'',30,1,400000.00,'STD','sdfssfs',15),(17,'',30,1,340000.00,'STD','fsdsf',16),(18,'',30,1,400000.00,'STD','vdsvs',17),(19,'cdscscsc',30,1,2000.00,'STD','30 days',18);
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
  `CreatedAt` datetime(6) DEFAULT NULL,
  `ExpireAt` datetime(6) DEFAULT NULL,
  `IsActive` bit(1) DEFAULT NULL,
  `IsDeleted` bit(1) DEFAULT NULL,
  `IsTrial` bit(1) DEFAULT NULL,
  `LicenseKey` varchar(255) NOT NULL,
  `OrderID` int NOT NULL,
  `ProductID` int NOT NULL,
  `TierID` int NOT NULL,
  `UserID` int NOT NULL,
  PRIMARY KEY (`LicenseID`),
  UNIQUE KEY `UKlgowkd550ncjommipnpvikg42` (`LicenseKey`),
  UNIQUE KEY `UK19hslsd66u15l125u2gfic9qn` (`OrderID`),
  KEY `FKqwgumrvqmqsn0tgvar20gll8a` (`ProductID`),
  KEY `FKpmiu3pymu8mk28mr4rtktbgb4` (`TierID`),
  KEY `FKginf68hw6mw0gptf52eowgjxo` (`UserID`),
  CONSTRAINT `FKg0tk83gpevbfk97x1c87tl6p1` FOREIGN KEY (`OrderID`) REFERENCES `Orders` (`orderID`),
  CONSTRAINT `FKginf68hw6mw0gptf52eowgjxo` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `FKpmiu3pymu8mk28mr4rtktbgb4` FOREIGN KEY (`TierID`) REFERENCES `LicenseTiers` (`TierID`),
  CONSTRAINT `FKqwgumrvqmqsn0tgvar20gll8a` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Licenses`
--

LOCK TABLES `Licenses` WRITE;
/*!40000 ALTER TABLE `Licenses` DISABLE KEYS */;
INSERT INTO `Licenses` VALUES (1,'2026-03-08 13:03:53.708391','2026-04-07 13:03:53.708391',_binary '',_binary '\0',_binary '\0','B1310992-2A00-4175-912A-EBE835D88A1A',8,17,18,7),(2,'2026-03-08 13:34:48.005802','2026-04-07 13:34:48.005802',_binary '',_binary '\0',_binary '\0','890AD5CA-B2AF-4194-9E74-D0403488B88B',12,15,16,7),(3,'2026-03-08 13:48:43.502417','2026-04-07 13:48:43.502417',_binary '',_binary '\0',_binary '\0','F845F777-8D10-4917-BDC9-8BDF6CD0C6F3',15,17,18,7),(4,'2026-03-09 02:16:40.834511','2026-04-08 02:16:40.834511',_binary '',_binary '\0',_binary '\0','2DB194B5-1578-4006-8C71-3EE1B836DB3A',18,17,18,7);
/*!40000 ALTER TABLE `Licenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Orders`
--

DROP TABLE IF EXISTS `Orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Orders` (
  `orderID` int NOT NULL AUTO_INCREMENT,
  `createdAt` datetime(6) DEFAULT NULL,
  `paymentStatus` varchar(255) DEFAULT NULL,
  `totalAmount` decimal(38,2) DEFAULT NULL,
  `ProductID` int DEFAULT NULL,
  `DiscountAmount` decimal(38,2) DEFAULT NULL,
  `PaymentMethod` varchar(255) DEFAULT NULL,
  `Quantity` int DEFAULT NULL,
  `TransactionRef` varchar(255) DEFAULT NULL,
  `UnitPrice` decimal(38,2) NOT NULL,
  `TierID` int NOT NULL,
  `UserID` int NOT NULL,
  PRIMARY KEY (`orderID`),
  KEY `FKnjx4oqsxdlxposkcpl28mk5n2` (`ProductID`),
  KEY `FK36mhhcrdfqdveq1l0ttciylnr` (`TierID`),
  KEY `FKph55bub15tpuk7emg6atv2yus` (`UserID`),
  CONSTRAINT `FK36mhhcrdfqdveq1l0ttciylnr` FOREIGN KEY (`TierID`) REFERENCES `LicenseTiers` (`TierID`),
  CONSTRAINT `FKnjx4oqsxdlxposkcpl28mk5n2` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`),
  CONSTRAINT `FKph55bub15tpuk7emg6atv2yus` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Orders`
--

LOCK TABLES `Orders` WRITE;
/*!40000 ALTER TABLE `Orders` DISABLE KEYS */;
INSERT INTO `Orders` VALUES (1,'2026-03-02 05:40:09.356969','COMPLETED',300.00,10,NULL,NULL,1,NULL,300.00,1,6),(2,'2026-03-02 05:40:09.356969','COMPLETED',400.00,10,NULL,NULL,1,NULL,400.00,1,7),(3,'2026-03-08 12:35:11.858303','FAILED',400000.00,17,0.00,'VNPay',1,'0',400000.00,18,7),(4,'2026-03-08 12:36:36.775576','FAILED',340000.00,16,0.00,'VNPay',1,'0',340000.00,17,7),(5,'2026-03-08 12:42:08.594663','FAILED',340000.00,16,0.00,'VNPay',1,'0',340000.00,17,7),(6,'2026-03-08 12:48:41.343043','FAILED',400000.00,17,0.00,'VNPay',1,'0',400000.00,18,7),(7,'2026-03-08 12:51:51.610946','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(8,'2026-03-08 13:02:41.519915','COMPLETED',400000.00,17,0.00,'VNPay',1,'15442466',400000.00,18,7),(9,'2026-03-08 13:10:48.869348','FAILED',340000.00,16,0.00,'VNPay',1,'0',340000.00,17,7),(10,'2026-03-08 13:11:03.466859','FAILED',340000.00,16,0.00,'VNPay',1,'0',340000.00,17,7),(11,'2026-03-08 13:32:42.218639','Pending',2000.00,18,0.00,'VNPay',1,NULL,2000.00,19,7),(12,'2026-03-08 13:33:45.586668','COMPLETED',400000.00,15,0.00,'VNPay',1,'15442483',400000.00,16,7),(13,'2026-03-08 13:47:50.331579','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(14,'2026-03-08 13:48:02.441417','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(15,'2026-03-08 13:48:07.989054','COMPLETED',400000.00,17,0.00,'VNPay',1,'15442492',400000.00,18,7),(16,'2026-03-08 13:48:55.807810','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(17,'2026-03-08 13:50:06.346300','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(18,'2026-03-09 02:15:08.207373','COMPLETED',400000.00,17,0.00,'VNPay',1,'15442837',400000.00,18,7),(19,'2026-03-09 02:41:54.812871','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(20,'2026-03-09 02:48:19.804380','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(21,'2026-03-09 02:48:26.065761','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7),(22,'2026-03-09 02:48:46.409359','Pending',400000.00,17,0.00,'VNPay',1,NULL,400000.00,18,7);
/*!40000 ALTER TABLE `Orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ProductImages`
--

DROP TABLE IF EXISTS `ProductImages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ProductImages` (
  `ImageID` int NOT NULL AUTO_INCREMENT,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `ImageType` varchar(255) DEFAULT NULL,
  `ImageUrl` varchar(255) NOT NULL,
  `IsPrimary` bit(1) DEFAULT NULL,
  `SortOrder` int DEFAULT NULL,
  `ProductID` int NOT NULL,
  PRIMARY KEY (`ImageID`),
  KEY `FKeugt720s2mm51cmqy9jld1d99` (`ProductID`),
  CONSTRAINT `FKeugt720s2mm51cmqy9jld1d99` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductImages`
--

LOCK TABLES `ProductImages` WRITE;
/*!40000 ALTER TABLE `ProductImages` DISABLE KEYS */;
INSERT INTO `ProductImages` VALUES (1,'2026-03-02 05:42:16.945142','SCREENSHOT','https://storage.tallt.com/products/codemaster-pro-screenshot1.png',_binary '',0,1),(2,'2026-03-02 08:10:09.635536','SCREENSHOT','1231231231',_binary '\0',0,2),(3,'2026-03-02 08:10:12.025079','SCREENSHOT','1231231231',_binary '\0',0,2),(4,'2026-03-02 14:50:57.627036','SCREENSHOT','123123123123',_binary '',0,3),(5,'2026-03-02 14:52:38.588290','SCREENSHOT','123123123',_binary '\0',0,4),(6,'2026-03-03 04:35:26.423530','SCREENSHOT','123123',_binary '\0',0,5),(7,'2026-03-03 04:39:51.228479','SCREENSHOT','123',_binary '\0',0,6),(8,'2026-03-03 04:50:16.180533','SCREENSHOT','123',_binary '\0',0,7),(9,'2026-03-03 04:51:54.401951','SCREENSHOT','123',_binary '\0',0,8),(10,'2026-03-03 05:03:28.057385','SCREENSHOT','123',_binary '\0',0,9),(11,'2026-03-03 19:27:13.269671','SCREENSHOT','https://www.shutterstock.com/image-vector/chatgpt-logo-vector-illustration-chat-600nw-2664020571.jpg',_binary '\0',0,10),(12,'2026-03-04 15:26:20.996067','SCREENSHOT','qưeqweqw',_binary '\0',0,11),(13,'2026-03-04 15:26:21.048311','SCREENSHOT','qưeqweq',_binary '\0',0,11),(14,'2026-03-04 15:26:21.108148','SCREENSHOT','qưeqwewq',_binary '\0',1,11),(15,'2026-03-04 19:35:47.182582','SCREENSHOT','dsvdsvd',_binary '\0',0,12),(16,'2026-03-04 19:36:33.570250','SCREENSHOT','dssvsd',_binary '\0',0,13),(17,'2026-03-04 19:37:21.610053','SCREENSHOT','dsfsf',_binary '\0',0,14),(18,'2026-03-04 19:38:24.039305','SCREENSHOT','dsfsf',_binary '\0',0,15),(19,'2026-03-04 19:39:32.772375','SCREENSHOT','asasfaf',_binary '\0',0,16),(20,'2026-03-05 06:17:34.159979','SCREENSHOT','dvvs',_binary '\0',0,17);
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
  KEY `FKryyinbhwibdkou4shvavu2axh` (`TagID`),
  CONSTRAINT `FKdbpqs76c0tatq6p6jxdbm930u` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`),
  CONSTRAINT `FKryyinbhwibdkou4shvavu2axh` FOREIGN KEY (`TagID`) REFERENCES `Tags` (`TagID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductTags`
--

LOCK TABLES `ProductTags` WRITE;
/*!40000 ALTER TABLE `ProductTags` DISABLE KEYS */;
INSERT INTO `ProductTags` VALUES (1,1),(1,2),(1,3),(1,4);
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
  `CreatedAt` datetime(6) DEFAULT NULL,
  `FileUrl` varchar(255) NOT NULL,
  `ProductID` int NOT NULL,
  `ReleaseNotes` tinytext,
  `ScanStatus` varchar(50) DEFAULT NULL,
  `VersionNumber` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`VersionID`),
  KEY `FKj9c3j5k0juo745hto7qweo08s` (`ProductID`),
  CONSTRAINT `FKj9c3j5k0juo745hto7qweo08s` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ProductVersions`
--

LOCK TABLES `ProductVersions` WRITE;
/*!40000 ALTER TABLE `ProductVersions` DISABLE KEYS */;
INSERT INTO `ProductVersions` VALUES (1,'2026-03-02 05:43:10.940492','https://storage.tallt.com/products/codemaster-pro-v1.0.0.zip',1,'Phiên bản đầu tiên: hỗ trợ Java, Python, JavaScript. AI code completion.','CLEAN','1.0.0'),(2,'2026-03-02 08:10:10.389251','12312312',2,'123123123','PENDING','123123'),(3,'2026-03-02 08:10:12.321541','12312312',2,'123123123','PENDING','123123'),(4,'2026-03-02 14:50:58.341918','123123123',3,'1231231231','PENDING','123'),(5,'2026-03-02 14:52:39.301170','12312312',4,'123123123','PENDING','123123'),(6,'2026-03-03 04:35:27.154786','123',5,'123','PENDING','123'),(7,'2026-03-03 04:39:51.860065','https://drive.google.com/drive/folders/1w_rJJjz1QRLaEp13b69LmEVdOxM6ZGoi',6,'123','PENDING','123'),(8,'2026-03-03 04:50:16.856292','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',7,'123123','CLEAN','123'),(9,'2026-03-03 04:51:55.118660','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',8,'123','CLEAN','123'),(10,'2026-03-03 05:03:28.876760','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',9,'123','CLEAN','123'),(11,'2026-03-03 19:27:13.361397','cscscs',10,'update product','PENDING','1.0.0'),(12,'2026-03-04 15:26:21.172215','qưeqweq',11,'qưeqweqw','PENDING','qưeqwe'),(13,'2026-03-04 19:35:47.233675','vssds',12,'sfdsfds','PENDING','1.0.0'),(14,'2026-03-04 19:36:33.602998','sácdac',13,'acdsvsv','PENDING','1.0.0'),(15,'2026-03-04 19:37:21.642546','gsfdgs',14,'vcxv','PENDING','1.0.1'),(16,'2026-03-04 19:38:24.074063','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',15,'sgsg','CLEAN','1.0.2'),(17,'2026-03-04 19:39:32.809584','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',16,'sdfdsf','CLEAN','1.0.1'),(18,'2026-03-05 06:17:34.214355','https://docs.google.com/document/d/1Pb3pCcQmH5IG9ZK70RER-5xyiyzwg63B/export?format=pdf',17,'dsvds','CLEAN','1.0.0');
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
  `BasePrice` decimal(38,2) DEFAULT NULL,
  `CategoryID` int NOT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `Description` tinytext,
  `HasTrial` bit(1) DEFAULT NULL,
  `ProductName` varchar(255) NOT NULL,
  `RejectionNote` tinytext,
  `Status` varchar(255) NOT NULL,
  `TrialDurationDays` int DEFAULT NULL,
  `VendorID` int NOT NULL,
  `GuideDocumentUrl` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`ProductID`),
  KEY `FKpuwdc4db4doatnavrifkfxgys` (`CategoryID`),
  KEY `FKg7lvd7fwibfc5e3e91a7bs8ml` (`VendorID`),
  CONSTRAINT `FKg7lvd7fwibfc5e3e91a7bs8ml` FOREIGN KEY (`VendorID`) REFERENCES `Vendors` (`VendorID`),
  CONSTRAINT `FKpuwdc4db4doatnavrifkfxgys` FOREIGN KEY (`CategoryID`) REFERENCES `Categories` (`CategoryID`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Products`
--

LOCK TABLES `Products` WRITE;
/*!40000 ALTER TABLE `Products` DISABLE KEYS */;
INSERT INTO `Products` VALUES (1,499000.00,1,'2026-03-02 05:40:09.356969','IDE chuyên nghiệp hỗ trợ Java, Python, JavaScript với AI code completion, syntax highlighting và integrated terminal.',_binary '','CodeMaster Pro IDE',NULL,'APPROVED',14,1,NULL),(2,213310.00,2,'2026-03-02 08:10:08.829043','ádasdasdasd',_binary '\0','ấdasdads',NULL,'PENDING',7,1,NULL),(3,123123.00,1,'2026-03-02 14:50:56.712779','213123123123',_binary '\0','sjdioasdijoasjdoia',NULL,'PENDING',7,1,NULL),(4,123123.00,1,'2026-03-02 14:52:37.868067','123123',_binary '\0','vanhchat123',NULL,'APPROVED',7,1,NULL),(5,123000.00,1,'2026-03-03 04:35:25.306845','123',_binary '\0','123',NULL,'PENDING',7,1,NULL),(6,123000.00,1,'2026-03-03 04:39:50.353696','123',_binary '\0','dekirutest',NULL,'PENDING',7,1,NULL),(7,123000.00,1,'2026-03-03 04:50:14.952456','123',_binary '\0','checklink',NULL,'APPROVED',7,1,NULL),(8,123000.00,1,'2026-03-03 04:51:53.674753','123',_binary '\0','checklink2',NULL,'APPROVED',7,1,NULL),(9,123000.00,1,'2026-03-03 05:03:27.338589','123',_binary '\0','checklink3',NULL,'APPROVED',7,1,NULL),(10,300000.00,1,'2026-03-03 19:27:12.987082','AI',_binary '\0','Chat GPT',NULL,'APPROVED',7,2,NULL),(11,200000.00,5,'2026-03-04 15:26:20.903991','qưe',_binary '\0','qưe',NULL,'APPROVED',7,1,NULL),(12,240000.00,4,'2026-03-04 19:35:47.100933','svdsv',_binary '\0','vdss',NULL,'APPROVED',7,1,NULL),(13,130000.00,2,'2026-03-04 19:36:33.524082','vdsvdsv',_binary '\0','dfsvsv',NULL,'APPROVED',7,1,NULL),(14,120000.00,3,'2026-03-04 19:37:21.570091','fsfđsf',_binary '\0','abcd',NULL,'APPROVED',7,1,NULL),(15,400000.00,4,'2026-03-04 19:38:23.997636','dsgggs',_binary '\0','sgsgdfsg',NULL,'APPROVED',7,1,NULL),(16,340000.00,3,'2026-03-04 19:39:32.726530','cvsvssds',_binary '\0','dsbsvsbvs',NULL,'APPROVED',7,1,NULL),(17,400000.00,3,'2026-03-05 06:17:34.048332','vdsvds',_binary '\0','dscvscvsv',NULL,'APPROVED',7,2,NULL),(18,2000.00,3,'2026-03-05 06:17:34.048332','dvdsvdsv',_binary '\0','test',NULL,'APPROVED',7,2,NULL);
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
  `Comment` longtext,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `Rating` int DEFAULT NULL,
  `ProductID` int NOT NULL,
  `UserID` int NOT NULL,
  PRIMARY KEY (`ReviewID`),
  KEY `FKp7h7unylnv24raqy7kpyc1o8o` (`ProductID`),
  KEY `FKihxyd8pdcc5upb417pv6ptl8b` (`UserID`),
  CONSTRAINT `FKihxyd8pdcc5upb417pv6ptl8b` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`),
  CONSTRAINT `FKp7h7unylnv24raqy7kpyc1o8o` FOREIGN KEY (`ProductID`) REFERENCES `Products` (`ProductID`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reviews`
--

LOCK TABLES `Reviews` WRITE;
/*!40000 ALTER TABLE `Reviews` DISABLE KEYS */;
INSERT INTO `Reviews` VALUES (16,'sdcscds','2026-03-08 10:25:31.146496',5,10,7);
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
  `RoleName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`RoleID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Roles`
--

LOCK TABLES `Roles` WRITE;
/*!40000 ALTER TABLE `Roles` DISABLE KEYS */;
INSERT INTO `Roles` VALUES (1,'ADMIN'),(2,'VENDOR'),(3,'CUSTOMER');
/*!40000 ALTER TABLE `Roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Tags`
--

DROP TABLE IF EXISTS `Tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Tags` (
  `TagID` int NOT NULL AUTO_INCREMENT,
  `TagName` varchar(255) NOT NULL,
  PRIMARY KEY (`TagID`),
  UNIQUE KEY `UK1xuta1p3llexcasetafj9f0te` (`TagName`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Tags`
--

LOCK TABLES `Tags` WRITE;
/*!40000 ALTER TABLE `Tags` DISABLE KEYS */;
INSERT INTO `Tags` VALUES (4,'code-editor'),(1,'ide'),(2,'java'),(3,'python');
/*!40000 ALTER TABLE `Tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Users` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `Email` varchar(255) NOT NULL,
  `FullName` varchar(255) DEFAULT NULL,
  `IsActive` bit(1) DEFAULT NULL,
  `PasswordHash` varchar(255) NOT NULL,
  `Username` varchar(255) NOT NULL,
  `RoleID` int NOT NULL,
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `UKjdfr6kjrxekx1j5vrr77rp44t` (`Email`),
  UNIQUE KEY `UK9cw87ffd4i55ki0qpkwu63er` (`Username`),
  KEY `FKjsyq92q5tj4da19fijtpse9ud` (`RoleID`),
  CONSTRAINT `FKjsyq92q5tj4da19fijtpse9ud` FOREIGN KEY (`RoleID`) REFERENCES `Roles` (`RoleID`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` VALUES (1,'2026-03-02 05:12:39.098869','admin@tallt.com','Admin TALLT',_binary '','$2a$10$1MZC9tK0mm27X/C/qzbz6uxSqxlJIEJbm1wCmLMnOQEUOtI.H/2HK','admin',1),(2,'2026-03-02 05:22:57.428547','customer1@gmail.com','Nguyen Van Khach',_binary '','$2a$10$ec/W791zgEHTA1/GU.qg4u5eAJ7W3VtHWIGMZCSXmyBUhS4Bl9zmS','customer1',3),(3,'2026-03-02 05:23:23.374753','vendor1@gmail.com','Tran Van Vendor',_binary '','$2a$10$PQ0liWPXffLzsdHvqVlXCuwd6gwOEghF5NA5FK1V18oLKFu1ahwhK','vendor1',2),(4,'2026-03-02 07:34:49.929419','tongvietanh25072005@gmail.com','vanh',_binary '','$2a$10$Otw.PS2qrhatOu16.oj0X.dsAYcnIdRPrTsu1ChkloCv/XV2K8EWW','tongvietanh25072005',1),(5,'2026-03-03 05:04:50.179379','john1@mail.com','vanhbao123',_binary '','$2a$10$EF9mEgNxrhyG8fO4GbWYJOgvLiH2c06rRaEnbOdMkL7luB3MjLk6m','john1',2),(6,'2026-03-03 05:13:57.813034','john2@mail.com','vanh',_binary '','$2a$10$syvQwxZn6kj/lNgPlTwBbuOI4DeUt4BD093qcKjt9uonI470dxwLi','john2',3),(7,'2026-03-04 15:53:34.813287','customer2@gmail.com','Đình Lâm',_binary '','$2a$10$f2a.g0XdY1pNbJ72ScTUROGQSZVCOfftc.O3/8.A9hhOjMajOCewO','customer2',3),(9,'2026-03-05 06:29:09.910819','lamtd@gmail.com','Đình Lâm',_binary '','$2a$10$XytZYUn7imdE6JpUAA304ekIMS22i5Cvx0ueudYeEp5yDQTShSLzS','lamtd',2);
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
  `Amount` decimal(38,2) DEFAULT NULL,
  `PayoutDate` datetime(6) DEFAULT NULL,
  `Status` varchar(255) DEFAULT NULL,
  `VendorID` int NOT NULL,
  PRIMARY KEY (`PayoutID`),
  KEY `FK1ewj7grx5aew04fj0wsammo4o` (`VendorID`),
  CONSTRAINT `FK1ewj7grx5aew04fj0wsammo4o` FOREIGN KEY (`VendorID`) REFERENCES `Vendors` (`VendorID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
  `CitizenID` varchar(255) DEFAULT NULL,
  `CompanyName` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `IdentificationDoc` varchar(255) DEFAULT NULL,
  `RejectionNote` varchar(255) DEFAULT NULL,
  `Status` enum('APPROVED','PENDING','REJECTED') NOT NULL,
  `TaxCode` varchar(255) DEFAULT NULL,
  `Type` enum('COMPANY','INDIVIDUAL') NOT NULL,
  `VerifiedAt` datetime(6) DEFAULT NULL,
  `UserID` int NOT NULL,
  `Description` text,
  PRIMARY KEY (`VendorID`),
  UNIQUE KEY `UK7pejn9ijv4f90ph22h519ljj5` (`UserID`),
  CONSTRAINT `FKlo8pn5btumo6elht61r8mfnd5` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vendors`
--

LOCK TABLES `Vendors` WRITE;
/*!40000 ALTER TABLE `Vendors` DISABLE KEYS */;
INSERT INTO `Vendors` VALUES (1,'079123456789','Tran Van Vendor Software','2026-03-02 05:25:29.512846','https://drive.google.com/cccd-vendor1.jpg',NULL,'APPROVED','','INDIVIDUAL',NULL,3,NULL),(2,'079123456789','Trại gà D211R','2026-03-03 05:07:50.582367','https://drive.google.com/cccd-vendor1.jpg',NULL,'APPROVED','','INDIVIDUAL','2026-03-03 05:08:32.132532',5,NULL),(5,'5235232','','2026-03-05 06:30:17.900151','https://drive.google.com/cccd-vendor1.jpg',NULL,'APPROVED','241434','INDIVIDUAL','2026-03-05 06:30:56.297520',9,'dscvsc');
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
  `Amount` decimal(38,2) NOT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `ReferenceID` int DEFAULT NULL,
  `Type` enum('COMMISSION_FEE','DEPOSIT','SALE_REVENUE','WITHDRAWAL') NOT NULL,
  `WalletID` int NOT NULL,
  PRIMARY KEY (`TransactionID`),
  KEY `FKqmskjtw99y7xb6orhbu627j0m` (`WalletID`),
  CONSTRAINT `FKqmskjtw99y7xb6orhbu627j0m` FOREIGN KEY (`WalletID`) REFERENCES `Wallets` (`WalletID`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WalletTransactions`
--

LOCK TABLES `WalletTransactions` WRITE;
/*!40000 ALTER TABLE `WalletTransactions` DISABLE KEYS */;
INSERT INTO `WalletTransactions` VALUES (1,450000.00,'2026-01-02 09:15:00.000000','Revenue from Order #101',101,'SALE_REVENUE',2),(2,620000.00,'2026-01-05 14:22:00.000000','Revenue from Order #102',102,'SALE_REVENUE',2),(3,800000.00,'2026-01-09 11:05:00.000000','Revenue from Order #103',103,'SALE_REVENUE',2),(4,510000.00,'2026-01-15 16:40:00.000000','Revenue from Order #104',104,'SALE_REVENUE',2),(5,990000.00,'2026-01-20 10:10:00.000000','Revenue from Order #105',105,'SALE_REVENUE',2),(6,730000.00,'2026-01-28 18:30:00.000000','Revenue from Order #106',106,'SALE_REVENUE',2),(7,1200000.00,'2026-02-01 08:55:00.000000','Revenue from Order #107',107,'SALE_REVENUE',2),(8,560000.00,'2026-02-05 13:17:00.000000','Revenue from Order #108',108,'SALE_REVENUE',2),(9,880000.00,'2026-02-10 15:45:00.000000','Revenue from Order #109',109,'SALE_REVENUE',2),(10,670000.00,'2026-02-14 19:20:00.000000','Revenue from Order #110',110,'SALE_REVENUE',2),(11,940000.00,'2026-02-18 12:00:00.000000','Revenue from Order #111',111,'SALE_REVENUE',2),(12,530000.00,'2026-02-20 09:35:00.000000','Revenue from Order #112',112,'SALE_REVENUE',2),(13,1100000.00,'2026-02-22 17:10:00.000000','Revenue from Order #113',113,'SALE_REVENUE',2),(14,760000.00,'2026-02-23 20:05:00.000000','Revenue from Order #114',114,'SALE_REVENUE',2),(15,1500000.00,'2026-02-25 10:25:00.000000','Revenue from Order #115',115,'SALE_REVENUE',2),(16,760000.00,'2026-02-26 10:25:00.000000','Revenue from Order #116',116,'SALE_REVENUE',2),(17,400000.00,'2026-03-08 13:03:53.739666','Revenue from Order #8',8,'SALE_REVENUE',2),(18,400000.00,'2026-03-08 13:34:48.034340','Revenue from Order #12',12,'SALE_REVENUE',1),(19,400000.00,'2026-03-08 13:48:43.519875','Revenue from Order #15',15,'SALE_REVENUE',2),(20,400000.00,'2026-03-09 02:16:40.858015','Revenue from Order #18',18,'SALE_REVENUE',2);
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
  `Balance` decimal(38,2) DEFAULT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `UserID` int NOT NULL,
  PRIMARY KEY (`WalletID`),
  UNIQUE KEY `UKlrforewk3641g4x54xkwyii0s` (`UserID`),
  CONSTRAINT `FK2jelxeglgevmxu9iywb3t8rp5` FOREIGN KEY (`UserID`) REFERENCES `Users` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Wallets`
--

LOCK TABLES `Wallets` WRITE;
/*!40000 ALTER TABLE `Wallets` DISABLE KEYS */;
INSERT INTO `Wallets` VALUES (1,400000.00,'2026-03-08 13:34:48.033334',3),(2,1200000.00,'2026-03-09 02:16:40.856844',5),(3,0.00,'2026-03-04 15:16:31.522510',6),(5,0.00,'2026-03-05 06:30:17.918284',9);
/*!40000 ALTER TABLE `Wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'TALLT_SoftwareMarket'
--

--
-- Dumping routines for database 'TALLT_SoftwareMarket'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-09 10:15:15
INSERT INTO Orders
(createdAt,paymentStatus,totalAmount,ProductID,DiscountAmount,PaymentMethod,Quantity,TransactionRef,UnitPrice,TierID,UserID)
VALUES

-- USER 1
('2026-01-05 09:12:00','PAID',499000,1,0,'VNPAY',1,'TXN1001',499000,1,1),
('2026-01-12 14:25:00','PAID',123,5,0,'PAYPAL',1,'TXN1002',123,5,1),
('2026-01-20 18:40:00','PAID',123,7,0,'VNPAY',1,'TXN1003',123,7,1),
('2026-02-02 10:15:00','PAID',123,8,0,'PAYPAL',1,'TXN1004',123,8,1),
('2026-02-18 21:30:00','PAID',123,9,0,'VNPAY',1,'TXN1005',123,9,1),

-- USER 2
('2026-01-03 08:45:00','PAID',499000,1,0,'PAYPAL',1,'TXN2001',499000,1,2),
('2026-01-15 11:20:00','PAID',123,5,0,'VNPAY',1,'TXN2002',123,5,2),
('2026-01-28 19:05:00','PAID',123,7,0,'PAYPAL',1,'TXN2003',123,7,2),
('2026-02-07 13:10:00','PAID',123,8,0,'VNPAY',1,'TXN2004',123,8,2),
('2026-02-25 16:55:00','PAID',123,9,0,'PAYPAL',1,'TXN2005',123,9,2),

-- USER 3
('2026-01-06 10:30:00','PAID',499000,1,0,'VNPAY',1,'TXN3001',499000,1,3),
('2026-01-18 15:42:00','PAID',123,5,0,'PAYPAL',1,'TXN3002',123,5,3),
('2026-01-27 20:15:00','PAID',123,7,0,'VNPAY',1,'TXN3003',123,7,3),
('2026-02-05 09:50:00','PAID',123,8,0,'PAYPAL',1,'TXN3004',123,8,3),
('2026-02-21 17:05:00','PAID',123,9,0,'VNPAY',1,'TXN3005',123,9,3),

-- USER 4
('2026-01-02 07:25:00','PAID',499000,1,0,'PAYPAL',1,'TXN4001',499000,1,4),
('2026-01-14 12:18:00','PAID',123,5,0,'VNPAY',1,'TXN4002',123,5,4),
('2026-01-23 19:40:00','PAID',123,7,0,'PAYPAL',1,'TXN4003',123,7,4),
('2026-02-10 14:33:00','PAID',123,8,0,'VNPAY',1,'TXN4004',123,8,4),
('2026-02-27 22:10:00','PAID',123,9,0,'PAYPAL',1,'TXN4005',123,9,4),

-- USER 5
('2026-01-07 11:05:00','PAID',499000,1,0,'VNPAY',1,'TXN5001',499000,1,5),
('2026-01-16 13:55:00','PAID',123,5,0,'PAYPAL',1,'TXN5002',123,5,5),
('2026-01-29 18:22:00','PAID',123,7,0,'VNPAY',1,'TXN5003',123,7,5),
('2026-02-12 09:40:00','PAID',123,8,0,'PAYPAL',1,'TXN5004',123,8,5),
('2026-02-24 20:18:00','PAID',123,9,0,'VNPAY',1,'TXN5005',123,9,5),

-- USER 6
('2026-01-04 10:10:00','PAID',499000,1,0,'PAYPAL',1,'TXN6001',499000,1,6),
('2026-01-19 16:32:00','PAID',123,5,0,'VNPAY',1,'TXN6002',123,5,6),
('2026-01-26 21:00:00','PAID',123,7,0,'PAYPAL',1,'TXN6003',123,7,6),
('2026-02-09 08:27:00','PAID',123,8,0,'VNPAY',1,'TXN6004',123,8,6),
('2026-02-26 17:45:00','PAID',123,9,0,'PAYPAL',1,'TXN6005',123,9,6); 




INSERT INTO Orders
(createdAt, paymentStatus, totalAmount, ProductID, DiscountAmount,
 PaymentMethod, Quantity, TransactionRef, UnitPrice, TierID, UserID)

SELECT
NOW(),
'COMPLETED',
lt.Price,
p.ProductID,
0,
'VNPAY',
1,
CONCAT('TXN', FLOOR(RAND()*1000000)),
lt.Price,
lt.TierID,
u.UserID

FROM Users u
JOIN (
    SELECT ProductID, TierID, Price
    FROM LicenseTiers
    WHERE ProductID IN (1,5,7,8,9)
    LIMIT 5
) lt ON 1=1
JOIN Products p ON p.ProductID = lt.ProductID

WHERE u.RoleID IN (2,3);

INSERT INTO Licenses
(LicenseKey, OrderID, UserID, ProductID, TierID, IsActive, IsTrial, CreatedAt)

SELECT
CONCAT('LICc-', UPPER(SUBSTRING(MD5(RAND()),3,10))),
o.OrderID,
o.UserID,
o.ProductID,
o.TierID,
1,
0,
NOW()

FROM Orders o
WHERE o.UserID = 10;


CREATE TABLE LicenseSessions (
    SessionID INT AUTO_INCREMENT PRIMARY KEY,

    LicenseID INT NOT NULL,
    DeviceIdentifier VARCHAR(255) NOT NULL,

    DeviceName VARCHAR(255),
    IPAddress VARCHAR(45),

    LoginTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastActive DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    IsActive BIT(1) DEFAULT b'1',

    CONSTRAINT FK_LicenseSessions_License
        FOREIGN KEY (LicenseID)
        REFERENCES Licenses(LicenseID)
        ON DELETE CASCADE,

    UNIQUE KEY UK_License_Device (LicenseID, DeviceIdentifier),

    INDEX IDX_LicenseSessions_LicenseID (LicenseID),
    INDEX IDX_LicenseSessions_LastActive (LastActive)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_general_ci;


INSERT INTO LicenseSessions
(LicenseID, DeviceIdentifier, DeviceName, IPAddress, LoginTime, LastActive, IsActive)
VALUES
(1, 'DEV-PC-001', 'Long-PC', '192.168.1.10', NOW(), NOW(), 1),

(1, 'DEV-LAPTOP-002', 'Asus-Laptop', '192.168.1.11', NOW(), NOW(), 1),

(2, 'DEV-PC-003', 'Office-PC', '192.168.1.20', NOW(), NOW(), 1),

(2, 'DEV-MAC-004', 'Macbook-Pro', '192.168.1.21', NOW(), NOW(), 1),

(3, 'DEV-PC-005', 'Gaming-PC', '192.168.1.30', NOW(), NOW(), 1);
