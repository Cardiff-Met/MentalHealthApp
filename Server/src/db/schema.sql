-- SEN5002 Mental Health Support App
-- Initial Database Schema

CREATE DATABASE IF NOT EXISTS mental_health_app;
USE mental_health_app;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL DEFAULT NULL
);

-- Mood logs table
CREATE TABLE IF NOT EXISTS mood_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  description TEXT,
  logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  url         VARCHAR(500),
  category    VARCHAR(50) DEFAULT 'general',
  min_mood    TINYINT DEFAULT 1,
  max_mood    TINYINT DEFAULT 5,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved resources
CREATE TABLE IF NOT EXISTS saved_resources (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  resource_id INT NOT NULL,
  saved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_save (user_id, resource_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Therapy slots
CREATE TABLE IF NOT EXISTS therapy_slots (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slot_date   DATE NOT NULL,
  slot_time   TIME NOT NULL,
  time_of_day ENUM('morning', 'afternoon', 'evening') NOT NULL,
  status      ENUM('available', 'pending', 'confirmed') DEFAULT 'available'
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  slot_id    INT NOT NULL,
  status     ENUM('pending', 'confirmed', 'declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (slot_id) REFERENCES therapy_slots(id) ON DELETE CASCADE
);

-- Password resets (token stored as hash — never plain text)
CREATE TABLE IF NOT EXISTS password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token_hash (token_hash),
  INDEX idx_user_expires (user_id, expires_at)
);

-- Audit log (append-only — no UPDATE or DELETE on this table)
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NULL,
  action     VARCHAR(100) NOT NULL,
  ip         VARCHAR(45)  NULL,
  user_agent TEXT         NULL,
  metadata   JSON         NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id   (user_id),
  INDEX idx_action    (action),
  INDEX idx_created   (created_at)
);

-- Seed resources
INSERT INTO resources (title, description, url, category, min_mood, max_mood) VALUES
  ('Crisis Support – Samaritans',      'Free confidential support. Call 116 123 anytime.',          'https://www.samaritans.org',             'crisis',      1, 1),
  ('NHS Urgent Mental Health Support', 'Call 111 and select option 2 for urgent support.',           'https://www.nhs.uk/mental-health',       'crisis',      1, 2),
  ('Student Minds – Managing Stress',  'Practical tips for managing stress during exam periods.',    'https://www.studentminds.org.uk',        'anxiety',     2, 3),
  ('Calm – Breathing Exercises',       'Guided breathing and mindfulness to reduce anxiety.',        'https://www.calm.com',                   'anxiety',     2, 4),
  ('Cardiff Met Wellbeing Services',   'Book an appointment with the university wellbeing team.',    'https://www.cardiffmet.ac.uk/wellbeing', 'general',     1, 5),
  ('MoodGym – Self-Help CBT',          'Free online cognitive behavioural therapy exercises.',       'https://moodgym.com.au',                 'self-help',   3, 5),
  ('NHS – Sleep and Tiredness Tips',   'Advice on improving sleep quality and managing fatigue.',    'https://www.nhs.uk/live-well/sleep',     'self-help',   3, 5),
  ('Headspace – Meditation',           'Guided meditation for stress relief and improved focus.',    'https://www.headspace.com',              'mindfulness', 4, 5);

-- Seed therapy slots (3 weeks of Mon–Fri, 09–11 morning, 14–16 afternoon, 1 h each)
INSERT INTO therapy_slots (slot_date, slot_time, time_of_day) VALUES
  ('2026-04-28','09:00:00','morning'),('2026-04-28','10:00:00','morning'),('2026-04-28','11:00:00','morning'),('2026-04-28','14:00:00','afternoon'),('2026-04-28','15:00:00','afternoon'),('2026-04-28','16:00:00','afternoon'),
  ('2026-04-29','09:00:00','morning'),('2026-04-29','10:00:00','morning'),('2026-04-29','11:00:00','morning'),('2026-04-29','14:00:00','afternoon'),('2026-04-29','15:00:00','afternoon'),('2026-04-29','16:00:00','afternoon'),
  ('2026-04-30','09:00:00','morning'),('2026-04-30','10:00:00','morning'),('2026-04-30','11:00:00','morning'),('2026-04-30','14:00:00','afternoon'),('2026-04-30','15:00:00','afternoon'),('2026-04-30','16:00:00','afternoon'),
  ('2026-05-01','09:00:00','morning'),('2026-05-01','10:00:00','morning'),('2026-05-01','11:00:00','morning'),('2026-05-01','14:00:00','afternoon'),('2026-05-01','15:00:00','afternoon'),('2026-05-01','16:00:00','afternoon'),
  ('2026-05-06','09:00:00','morning'),('2026-05-06','10:00:00','morning'),('2026-05-06','11:00:00','morning'),('2026-05-06','14:00:00','afternoon'),('2026-05-06','15:00:00','afternoon'),('2026-05-06','16:00:00','afternoon'),
  ('2026-05-07','09:00:00','morning'),('2026-05-07','10:00:00','morning'),('2026-05-07','11:00:00','morning'),('2026-05-07','14:00:00','afternoon'),('2026-05-07','15:00:00','afternoon'),('2026-05-07','16:00:00','afternoon'),
  ('2026-05-08','09:00:00','morning'),('2026-05-08','10:00:00','morning'),('2026-05-08','11:00:00','morning'),('2026-05-08','14:00:00','afternoon'),('2026-05-08','15:00:00','afternoon'),('2026-05-08','16:00:00','afternoon'),
  ('2026-05-09','09:00:00','morning'),('2026-05-09','10:00:00','morning'),('2026-05-09','11:00:00','morning'),('2026-05-09','14:00:00','afternoon'),('2026-05-09','15:00:00','afternoon'),('2026-05-09','16:00:00','afternoon'),
  ('2026-05-12','09:00:00','morning'),('2026-05-12','10:00:00','morning'),('2026-05-12','11:00:00','morning'),('2026-05-12','14:00:00','afternoon'),('2026-05-12','15:00:00','afternoon'),('2026-05-12','16:00:00','afternoon'),
  ('2026-05-13','09:00:00','morning'),('2026-05-13','10:00:00','morning'),('2026-05-13','11:00:00','morning'),('2026-05-13','14:00:00','afternoon'),('2026-05-13','15:00:00','afternoon'),('2026-05-13','16:00:00','afternoon'),
  ('2026-05-14','09:00:00','morning'),('2026-05-14','10:00:00','morning'),('2026-05-14','11:00:00','morning'),('2026-05-14','14:00:00','afternoon'),('2026-05-14','15:00:00','afternoon'),('2026-05-14','16:00:00','afternoon'),
  ('2026-05-15','09:00:00','morning'),('2026-05-15','10:00:00','morning'),('2026-05-15','11:00:00','morning'),('2026-05-15','14:00:00','afternoon'),('2026-05-15','15:00:00','afternoon'),('2026-05-15','16:00:00','afternoon'),
  ('2026-05-16','09:00:00','morning'),('2026-05-16','10:00:00','morning'),('2026-05-16','11:00:00','morning'),('2026-05-16','14:00:00','afternoon'),('2026-05-16','15:00:00','afternoon'),('2026-05-16','16:00:00','afternoon');

-- Seed admin user (password: Admin1234! — bcrypt hash, 10 rounds)
INSERT IGNORE INTO users (email, password, role) VALUES
  ('admin@cardiffmet.ac.uk', '$2b$10$9z47CH5TqyvEOq0zC3f7NOQKV6adjALvgrhL2YO/jS1TqzlijBOp6', 'admin');