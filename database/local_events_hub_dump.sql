-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: local_events_hub
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `local_events_hub`
--

/*!40000 DROP DATABASE IF EXISTS `local_events_hub`*/;

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `local_events_hub` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `local_events_hub`;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `item_type` varchar(30) NOT NULL,
  `item_id` int(11) DEFAULT NULL,
  `details` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,1,'create','event',1,'Added event: Spring Night Market','2026-09-25 14:33:09'),(2,1,'create','event',2,'Added event: Jazz by the River','2026-09-25 14:33:09'),(3,2,'create','event',3,'Added event: Kids Coding Workshop','2026-09-25 14:33:09'),(4,3,'create','ticket_request',1,'Asked for 4 tickets for event 1','2026-09-25 14:33:09'),(5,1,'approved','ticket_request',1,'Request approved','2026-09-25 14:33:09'),(6,2,'approved','ticket_request',3,'Request approved','2026-09-25 14:33:09'),(7,1,'rejected','ticket_request',6,'Request rejected','2026-09-25 14:33:09'),(8,3,'cancel','ticket_request',7,'Request cancelled','2026-09-25 14:33:09');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_suggestions`
--

DROP TABLE IF EXISTS `ai_suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_suggestions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `event_id` int(11) DEFAULT NULL,
  `input_text` varchar(255) NOT NULL,
  `suggestions` text NOT NULL,
  `chosen_option` int(11) DEFAULT NULL,
  `final_text` text DEFAULT NULL,
  `status` enum('suggested','accepted','edited','rejected') NOT NULL DEFAULT 'suggested',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `event_id` (`event_id`),
  CONSTRAINT `ai_suggestions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ai_suggestions_ibfk_2` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_suggestions`
--

LOCK TABLES `ai_suggestions` WRITE;
/*!40000 ALTER TABLE `ai_suggestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_suggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(60) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Music','2026-09-25 14:33:09'),(2,'Food and Market','2026-09-25 14:33:09'),(3,'Sport','2026-09-25 14:33:09'),(4,'Workshop','2026-09-25 14:33:09'),(5,'Family','2026-09-25 14:33:09'),(6,'Arts','2026-09-25 14:33:09');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(120) NOT NULL,
  `description` text NOT NULL,
  `category_id` int(11) NOT NULL,
  `venue` varchar(150) NOT NULL,
  `event_date` date NOT NULL,
  `event_time` time NOT NULL,
  `total_tickets` int(11) NOT NULL,
  `price` decimal(8,2) NOT NULL DEFAULT 0.00,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_events_date` (`event_date`),
  KEY `idx_events_title` (`title`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `events_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
INSERT INTO `events` VALUES (1,'Spring Night Market','Street food, local farmers and handmade goods under the lights. Live acoustic music from 6pm. Bring the whole family.',2,'Town Square','2026-10-17','17:00:00',400,0.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(2,'Jazz by the River','An evening of smooth jazz with three local bands. Bring a picnic rug. Drinks and snacks for sale.',1,'Riverside Park Stage','2026-10-24','18:30:00',250,15.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(3,'Kids Coding Workshop','A fun two hour workshop for kids aged 8 to 12. Learn to make a small game with Scratch. Laptops are given.',4,'City Library Room 2','2026-10-31','10:00:00',20,5.00,'open',2,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(4,'Community Fun Run 5K','A 5 km fun run and walk around the lake. All ages and all speeds. Medal for every finisher.',3,'Lakeside Reserve','2026-11-08','07:30:00',300,10.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(5,'Halloween Family Party','Costume parade, face painting, games and a small haunted house for kids. Prize for the best costume.',5,'Community Hall','2026-10-31','16:00:00',150,0.00,'open',2,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(6,'Photography Walk','Walk through the old town with a local photographer. Learn tips for better photos with your phone.',6,'Meet at Clock Tower','2026-11-14','09:00:00',25,0.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(7,'Summer Rock Festival','Five rock bands on one stage. Food trucks and a chill zone. 18+ only after 8pm.',1,'Showground','2026-12-05','14:00:00',1000,35.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(8,'Pottery for Beginners','Make your own bowl and cup. All clay and tools are included. Pieces are ready to take home after 2 weeks.',4,'Art Centre Studio','2026-11-21','13:00:00',12,40.00,'open',2,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(9,'Christmas Carols Night','Sing carols with the town choir. Candles are given at the gate. Gold coin donation for the food bank.',1,'Town Square','2026-12-19','19:00:00',600,0.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(10,'Winter Food Festival','Hot soups, curries and desserts from 20 local cafes. This event has finished.',2,'Town Square','2026-07-11','11:00:00',500,0.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(11,'Basketball 3 on 3','Street basketball competition for teams of three. Register as a team or join on the day.',3,'Youth Centre Courts','2026-11-28','09:00:00',64,0.00,'open',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(12,'Old Movie Night (moved)','Classic film under the stars. This event is closed because of the weather.',6,'Riverside Park','2026-10-10','19:30:00',200,0.00,'closed',1,NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09');
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_requests`
--

DROP TABLE IF EXISTS `ticket_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `event_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
  `updated_by` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `event_id` (`event_id`),
  KEY `user_id` (`user_id`),
  KEY `updated_by` (`updated_by`),
  KEY `idx_tickets_status` (`status`),
  CONSTRAINT `ticket_requests_ibfk_1` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_requests_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_requests_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_requests`
--

LOCK TABLES `ticket_requests` WRITE;
/*!40000 ALTER TABLE `ticket_requests` DISABLE KEYS */;
INSERT INTO `ticket_requests` VALUES (1,1,3,4,'Two adults and two kids','approved',1,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(2,2,3,2,NULL,'pending',NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(3,3,4,1,'My son is 9','approved',2,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(4,4,4,2,NULL,'pending',NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(5,5,5,3,'We need a pram space','pending',NULL,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(6,7,5,2,NULL,'rejected',1,'2026-09-25 14:33:09','2026-09-25 14:33:09'),(7,8,3,1,NULL,'cancelled',3,'2026-09-25 14:33:09','2026-09-25 14:33:09');
/*!40000 ALTER TABLE `ticket_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Event Admin','admin@localevents.example','$2a$10$VCWzkGwgdVOOprhScIuvH.Azm5ZeF8T0iA4vgFIQuXPEk2zHjl636','admin','2026-09-25 14:33:09','2026-09-25 14:33:09'),(2,'Priya Staff','priya@localevents.example','$2a$10$VCWzkGwgdVOOprhScIuvH.Azm5ZeF8T0iA4vgFIQuXPEk2zHjl636','admin','2026-09-25 14:33:09','2026-09-25 14:33:09'),(3,'Sam Taylor','sam@example.com','$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.','user','2026-09-25 14:33:09','2026-09-25 14:33:09'),(4,'Lee Nguyen','lee@example.com','$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.','user','2026-09-25 14:33:09','2026-09-25 14:33:09'),(5,'Mia Brown','mia@example.com','$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.','user','2026-09-25 14:33:09','2026-09-25 14:33:09');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-25 14:33:09
