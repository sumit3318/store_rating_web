-- Store Rating Web Application - database schema (MySQL 8)
--
-- SAFE TO RE-RUN: this file only creates things that do not exist yet
-- (CREATE ... IF NOT EXISTS). It never drops tables or deletes data.
-- To wipe and rebuild on purpose, use:  npm run db:setup -- --force   (see README).

CREATE DATABASE IF NOT EXISTS store_rating
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE store_rating;

-- One table for all three roles. The "role" column decides what a user can do.
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(60)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt hash, never the plain password
  address       VARCHAR(400) NOT NULL,
  role          ENUM('admin', 'user', 'owner') NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- A store belongs to at most one owner (a user with role 'owner').
-- UNIQUE(owner_id) means one owner can own only one store, which keeps the
-- "owner sees only their own store" rule simple.
CREATE TABLE IF NOT EXISTS stores (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  address    VARCHAR(400) NOT NULL,
  owner_id   INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stores_email (email),
  UNIQUE KEY uq_stores_owner (owner_id),
  CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- One row per (user, store). The UNIQUE key is what stops duplicate ratings;
-- changing a rating updates this same row.
CREATE TABLE IF NOT EXISTS ratings (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  store_id   INT UNSIGNED NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ratings_user_store (user_id, store_id),
  KEY idx_ratings_store (store_id),
  CONSTRAINT chk_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_ratings_user  FOREIGN KEY (user_id)  REFERENCES users (id)  ON DELETE CASCADE,
  CONSTRAINT fk_ratings_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB;
