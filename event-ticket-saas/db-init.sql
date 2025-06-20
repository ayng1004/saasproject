-- Script d'initialisation pour les bases de données PostgreSQL
-- Ce script doit être exécuté par un utilisateur ayant les droits de création de base de données

-- Création des bases de données
CREATE DATABASE users_db;
CREATE DATABASE events_db;
CREATE DATABASE tickets_db;
CREATE DATABASE notifications_db;

-- Création d'un utilisateur dédié pour les applications (avec moins de privilèges)
CREATE USER app_user WITH ENCRYPTED PASSWORD 'app_password';

-- Attribution des droits à l'utilisateur sur les bases de données
GRANT ALL PRIVILEGES ON DATABASE users_db TO app_user;
GRANT ALL PRIVILEGES ON DATABASE events_db TO app_user;
GRANT ALL PRIVILEGES ON DATABASE tickets_db TO app_user;
GRANT ALL PRIVILEGES ON DATABASE notifications_db TO app_user;

-- Connexion à la base users_db
\c users_db

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'User',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Création d'un utilisateur admin par défaut (mot de passe: admin123)
-- Note: En production, il faudrait utiliser bcrypt pour hacher le mot de passe
INSERT INTO users (email, password, first_name, last_name, role)
VALUES ('admin@example.com', '$2b$10$EUv8OIk0CYlMkj.KEmJ.EuDQJIBY7TlwyVJ5eqVCFWDdEDYrxZyCO', 'Admin', 'User', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Connexion à la base events_db
\c events_db

-- Création des tables pour les événements
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  event_date TIMESTAMP NOT NULL,
  total_seats INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  creator_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS event_category_mapping (
  event_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  PRIMARY KEY (event_id, category_id)
);

-- Insertion des catégories d'événements par défaut
INSERT INTO event_categories (name) VALUES
  ('Concert'),
  ('Conference'),
  ('Workshop'),
  ('Exhibition'),
  ('Sport'),
  ('Festival')
ON CONFLICT (name) DO NOTHING;

-- Connexion à la base tickets_db
\c tickets_db

-- Création des tables pour la gestion des billets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'reserved',
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connexion à la base notifications_db
\c notifications_db

-- Création des tables pour la gestion des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertion de templates de notifications par défaut
INSERT INTO notification_templates (name, subject, content) VALUES
  ('ticket_purchase', 'Confirmation de votre achat de billet', 'Bonjour {{firstName}}, Nous vous confirmons l''achat de votre billet pour l''événement {{eventName}}. Votre numéro de billet est: {{ticketNumber}}'),
  ('event_reminder', 'Rappel: Événement à venir', 'Bonjour {{firstName}}, Nous vous rappelons que l''événement {{eventName}} aura lieu le {{eventDate}}.')
ON CONFLICT (name) DO NOTHING;

-- Attribuer les droits à l'utilisateur sur les tables créées
\c users_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

\c events_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

\c tickets_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

\c notifications_db
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;