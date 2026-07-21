-- Bravin Transport — Database Schema
CREATE DATABASE IF NOT EXISTS bravin_transport CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bravin_transport;

-- ============ RIDERS ============
CREATE TABLE riders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,          -- e.g. 2567XXXXXXXX
  password_hash VARCHAR(255) NOT NULL,
  fname VARCHAR(60) NOT NULL,
  lname VARCHAR(60) NOT NULL,
  email VARCHAR(120) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ DRIVERS ============
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  fname VARCHAR(60) NOT NULL,
  lname VARCHAR(60) NOT NULL,
  email VARCHAR(120) DEFAULT NULL,
  vehicle_type ENUM('boda','taxi','private') NOT NULL,
  plate VARCHAR(20) NOT NULL,
  route VARCHAR(120) DEFAULT NULL,
  approval_status ENUM('pending','approved','rejected') DEFAULT 'pending',
  is_online TINYINT(1) DEFAULT 0,
  current_lat DECIMAL(10,7) DEFAULT NULL,
  current_lng DECIMAL(10,7) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============ SESSIONS (auth tokens, so login is a ONE-TIME thing) ============
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(64) NOT NULL UNIQUE,
  user_type ENUM('rider','driver') NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX (token)
);

-- ============ TRIPS (ready for the next step: ride booking) ============
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  rider_id INT NOT NULL,
  driver_id INT DEFAULT NULL,
  ride_type ENUM('boda','taxi','private') NOT NULL,
  pickup_lat DECIMAL(10,7) NOT NULL,
  pickup_lng DECIMAL(10,7) NOT NULL,
  pickup_address VARCHAR(255) DEFAULT NULL,
  dropoff_lat DECIMAL(10,7) NOT NULL,
  dropoff_lng DECIMAL(10,7) NOT NULL,
  dropoff_address VARCHAR(255) DEFAULT NULL,
  distance_km DECIMAL(6,2) DEFAULT NULL,
  price_ugx INT DEFAULT NULL,
  status ENUM('searching','accepted','ongoing','completed','cancelled') DEFAULT 'searching',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rider_id) REFERENCES riders(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);
