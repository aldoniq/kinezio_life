#!/bin/bash

# Скрипт установки Docker на Ubuntu
# Использование: ./docker-install.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Проверка прав root
if [[ $EUID -eq 0 ]]; then
   error "Не запускайте скрипт от root! Используйте sudo для отдельных команд."
fi

log "🐳 Установка Docker на Ubuntu..."

# Обновление системы
log "Обновление системы..."
sudo apt update
sudo apt upgrade -y

# Установка необходимых пакетов
log "Установка необходимых пакетов..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Добавление официального GPG ключа Docker
log "Добавление GPG ключа Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
log "Добавление репозитория Docker..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Обновление списка пакетов
log "Обновление списка пакетов..."
sudo apt update

# Установка Docker
log "Установка Docker..."
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Добавление пользователя в группу docker
log "Добавление пользователя в группу docker..."
sudo usermod -aG docker $USER

# Запуск и включение Docker
log "Запуск Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# Установка Docker Compose (отдельно)
log "Установка Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
log "Проверка установки..."
docker --version
docker-compose --version

log "✅ Docker успешно установлен!"
log "⚠️ ВНИМАНИЕ: Перезайдите в систему или выполните 'newgrp docker' для применения изменений группы"

echo ""
echo "📋 Следующие шаги:"
echo "1. Перезайдите в систему или выполните: newgrp docker"
echo "2. Проверьте установку: docker --version"
echo "3. Запустите развертывание: ./docker-deploy.sh"
echo ""
echo "🔧 Полезные команды Docker:"
echo "  docker ps                    - список контейнеров"
echo "  docker images                - список образов"
echo "  docker system prune          - очистка неиспользуемых ресурсов"
echo "  docker logs <container>      - логи контейнера"
