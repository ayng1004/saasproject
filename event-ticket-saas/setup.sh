#!/bin/bash

# Script de configuration pour le projet Event Ticket SaaS
# Ce script facilite la mise en place et le test des bases de données

# Couleurs pour les sorties
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Fonction pour afficher les messages
print_message() {
  echo -e "${BOLD}${2}${1}${NC}"
}

print_success() {
  print_message "$1" "${GREEN}"
}

print_warning() {
  print_message "$1" "${YELLOW}"
}

print_error() {
  print_message "$1" "${RED}"
}

# Vérifier si Docker est installé
check_docker() {
  if ! command -v docker &> /dev/null; then
    print_error "Docker n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
  else
    print_success "✅ Docker est installé."
  fi

  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose n'est pas installé. Veuillez installer Docker Desktop."
    exit 1
  else
    print_success "✅ Docker Compose est installé."
  fi
}

# Démarrer les conteneurs de base de données uniquement
start_databases() {
  print_message "\n🚀 Démarrage des bases de données PostgreSQL..." "${YELLOW}"
  
  # Démarrer uniquement les services de base de données
  docker-compose up -d users-db events-db tickets-db notifications-db
  
  if [ $? -eq 0 ]; then
    print_success "✅ Les bases de données ont été démarrées avec succès."
  else
    print_error "❌ Erreur lors du démarrage des bases de données."
    exit 1
  fi
  
  # Attendre que PostgreSQL soit prêt
  print_message "\n⏳ Attente du démarrage de PostgreSQL..." "${YELLOW}"
  sleep 10
}

# Initialiser les bases de données
initialize_databases() {
  print_message "\n🔧 Initialisation des bases de données..." "${YELLOW}"
  
  # Exécuter le script SQL dans le conteneur users-db (qui est connecté à PostgreSQL)
  docker cp ./db-init.sql users-db:/tmp/db-init.sql
  docker exec -u postgres users-db psql -f /tmp/db-init.sql
  
  if [ $? -eq 0 ]; then
    print_success "✅ Les bases de données ont été initialisées avec succès."
  else
    print_error "❌ Erreur lors de l'initialisation des bases de données."
    exit 1
  fi
}

# Démarrer tous les services
start_services() {
  print_message "\n🚀 Démarrage de tous les services..." "${YELLOW}"
  
  docker-compose up -d
  
  if [ $? -eq 0 ]; then
    print_success "✅ Tous les services ont été démarrés avec succès."
  else
    print_error "❌ Erreur lors du démarrage des services."
    exit 1
  fi
  
  # Attendre que les services soient prêts
  print_message "\n⏳ Attente du démarrage des services..." "${YELLOW}"
  sleep 15
}

# Mettre à l'échelle les services
scale_services() {
  print_message "\n🔄 Mise à l'échelle des microservices..." "${YELLOW}"
  
  # Mise à l'échelle des services clés
  docker-compose up -d --scale users-service=2 --scale events-service=2 --scale tickets-service=2
  
  if [ $? -eq 0 ]; then
    print_success "✅ Les services ont été mis à l'échelle avec succès."
  else
    print_error "❌ Erreur lors de la mise à l'échelle des services."
    return 1
  fi
  
  print_message "\nÉtat actuel des services:" "${YELLOW}"
  docker-compose ps
}

# Tester les connexions
test_connections() {
  print_message "\n🔍 Test des connexions aux bases de données et services..." "${YELLOW}"
  
  # Installer les dépendances nécessaires pour le script de test
  if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Impossible d'exécuter les tests de connexion."
    return 1
  fi
  
  npm install --no-save pg axios
  
  # Exécuter le script de test
  node connection-test.js
  
  if [ $? -eq 0 ]; then
    print_success "✅ Tous les tests de connexion ont réussi."
  else
    print_error "❌ Certains tests de connexion ont échoué. Vérifiez les logs pour plus de détails."
    return 1
  fi
}

# Afficher le menu
show_menu() {
  print_message "\n📋 Menu:" "${BOLD}"
  print_message "1) Installation complète (BDD + services + tests)" "${BOLD}"
  print_message "2) Démarrer uniquement les bases de données" "${BOLD}"
  print_message "3) Démarrer tous les services" "${BOLD}"
  print_message "4) Mettre à l'échelle les services (load balancing)" "${BOLD}"
  print_message "5) Tester les connexions" "${BOLD}"
  print_message "6) Tout arrêter" "${BOLD}"
  print_message "0) Quitter" "${BOLD}"
  
  read -p "Entrez votre choix (0-6): " choice
  
  case $choice in
    1) full_installation ;;
    2) start_databases ;;
    3) start_services ;;
    4) scale_services ;;
    5) test_connections ;;
    6) docker-compose down && print_success "✅ Tous les services ont été arrêtés." ;;
    0) exit 0 ;;
    *) print_error "Choix invalide. Veuillez réessayer." && show_menu ;;
  esac
  
  # Retourner au menu après l'exécution
  show_menu
}

# Installation complète
full_installation() {
  check_docker
  start_databases
  initialize_databases
  start_services
  test_connections
  
  if [ $? -eq 0 ]; then
    print_message "\n==============================================" "${GREEN}"
    print_message "   🎉 Configuration réussie ! Le système est prêt.   " "${GREEN}"
    print_message "==============================================" "${GREEN}"
    print_message "\n📋 Résumé:" "${BOLD}"
    print_message "   - Services d'API: http://localhost:3000" "${BOLD}"
    print_message "   - Interface d'administration de la BDD: http://localhost:8080" "${BOLD}"
    print_message "   - Service utilisateurs: http://localhost:4001" "${BOLD}"
    print_message "   - Service événements: http://localhost:4002" "${BOLD}"
    print_message "   - Service billets: http://localhost:4003" "${BOLD}"
    print_message "   - Service notifications: http://localhost:4004" "${BOLD}"
    print_message "   - Load Balancer: http://localhost:80" "${BOLD}"
    
    # Demander si l'utilisateur souhaite mettre à l'échelle les services
    print_message "\nSouhaitez-vous mettre à l'échelle les services pour le load balancing? (o/n)" "${YELLOW}"
    read -p "" scale_choice
    
    if [[ $scale_choice == "o" || $scale_choice == "O" ]]; then
      scale_services
    fi
  else
    print_message "\n==============================================" "${RED}"
    print_message "   ❌ Des problèmes ont été détectés lors de la configuration.   " "${RED}"
    print_message "==============================================" "${RED}"
    print_message "\nConsultez les messages d'erreur ci-dessus pour résoudre les problèmes." "${BOLD}"
  fi
}

# Fonction principale
main() {
  print_message "\n==============================================" "${BOLD}"
  print_message "   Event Ticket SaaS - Script de Configuration   " "${BOLD}"
  print_message "==============================================" "${BOLD}"
  
  # Afficher le menu
  show_menu
}

# Exécuter la fonction principale
main