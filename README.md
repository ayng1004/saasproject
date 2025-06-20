# 🎟️ 4WEBD – Solution SaaS de billetterie événementielle

4WEBD est une application complète de gestion de billetterie pour événements, concerts et spectacles. Pensée pour les organisateurs de toutes tailles, elle repose sur une architecture microservices robuste, un système d'authentification sécurisé, et des interfaces web.

---

## 🚀 Objectifs

- ✅ API REST pour la gestion des utilisateurs, événements et billets
- ✅ Authentification JWT avec rôles multiples (Admin, EventCreator, Utilisateur)
- ✅ Paiement simulé et achat de billets avec confirmation via Redis
- ✅ Tests automatisés (unitaires, intégration)
- ✅ Conteneurisation complète avec Docker + Gateway NGINX
- ✅ Documentation Swagger (OpenAPI) pour chaque microservice

---

## 🧱 Architecture

Architecture **microservices** conteneurisée avec orchestration via Docker Compose :

| Microservice        | Rôle principal                              |
|---------------------|---------------------------------------------|
| `users-service`     | Gestion des utilisateurs et JWT             |
| `events-service`    | Création et gestion des événements          |
| `tickets-service`   | Réservation et gestion des billets          |
| `payments-service`  | Simulation du paiement                      |
| `notifications-service` | Notification asynchrone via Redis       |
| `api-gateway`       | Point d’entrée unique (proxy)               |
| `PostgreSQL`        | Stockage relationnel                        |
| `Redis`             | File de traitement asynchrone               |



---

## ✨ Fonctionnalités clés

### 👤 Utilisateurs
- Enregistrement, connexion, modification du mot de passe
- JWT sécurisé avec rôles (`Admin`, `EventCreator`, `User`)
- Gestion du profil et des permissions

### 📅 Événements
- Création, mise à jour, suppression d’événements (restreinte par rôle)
- Limitation des places pour chaque événement
- Protection contre la survente

### 🎫 Billets & Paiement
- Achat de billets avec simulation de paiement
- Génération de confirmation via Redis + système de notification
- Vérification d'accès aux événements achetés

---

## 🖥️ Interfaces

- **Web (React – CRA)** : inscription, tableau de bord, liste des événements
- Interface dynamique adaptée au rôle de l’utilisateur connecté

---

## ⚙️ Déploiement

- Architecture conteneurisée avec Docker
- Utilisation de `docker-compose` pour l’orchestration
- Reverse Proxy via NGINX :

```nginx
server {
    listen 80;
    location /api/ {
        proxy_pass http://api-gateway:3000/;
    }
}

✅ Tests & Qualité
🧪 Outils utilisés :
Jest + Supertest pour les tests unitaires et d’intégration

mockDb.js pour simuler PostgreSQL dans les tests

📂 Structure des tests :

users-service/
├── controllers/
├── middlewares/
├── services/
├── mocks/
├── tests/
└── setup.js

🔁 Tests d’intégration :

GET /api/tickets/my          # 200 (avec JWT) | 401/403 (sans JWT)
POST /api/tickets/purchase   # 401 (si non connecté)
📘 Documentation Swagger
Chaque microservice expose ses routes via Swagger.

Format : fichiers .yaml + swagger-ui-express

Exemple d'accès : http://localhost:4000/api-docs


🛠️ Tâches réalisées
✅ Architecture microservices avec Gateway

✅ Authentification sécurisée JWT

✅ CRUD utilisateurs et événements

✅ Achat de billets avec Redis

✅ Conteneurisation complète avec Docker

✅ Load balancing avec NGINX

✅ Tests unitaires et d’intégration

✅ Début des interfaces Web & Mobile

✅ Documentation  (Swagger & technique)

📦 Technologies
Composant	Stack
Backend	Node.js, Express.js
Frontend Web	React.js (CRA)
Mobile App	React Native
Authentification	JWT, rôles, middleware
Bases de données	PostgreSQL + Sequelize
Messaging	Redis
Conteneurs	Docker + Docker Compose
Proxy/API	NGINX
Tests	Jest, Supertest
Docs API	Swagger (OpenAPI)

