#!/bin/bash

# Безопасный скрипт развертывания Kinezio Life
# Домен: yelzhassay.kz
# Git: git@github.com:aldoniq/kinezio_life.git

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Параметры
DOMAIN="yelzhassay.kz"
GIT_REPO="git@github.com:aldoniq/kinezio_life.git"
PROJECT_DIR="/var/www/kinezio_life"
NGINX_SITES_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

log "🚀 Безопасное развертывание Kinezio Life для домена $DOMAIN..."

# Создание директории проекта (только если не существует)
log "Создание директории проекта..."
if [ ! -d "$PROJECT_DIR" ]; then
    sudo mkdir -p $PROJECT_DIR
    sudo chown $USER:$USER $PROJECT_DIR
    log "Директория $PROJECT_DIR создана"
else
    log "Директория $PROJECT_DIR уже существует"
fi

cd $PROJECT_DIR

# Клонирование или обновление репозитория
log "Клонирование/обновление репозитория..."
if [ -d ".git" ]; then
    log "Обновление существующего репозитория..."
    git pull origin main
else
    log "Клонирование репозитория..."
    git clone $GIT_REPO .
fi

# Создание Docker файлов (только если не существуют)
log "Создание Docker файлов..."

if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["npm", "start"]
EOF
    log "Dockerfile создан"
fi

if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  kinezio_life:
    build: .
    container_name: kinezio_life
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://yelzhassay.kz}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TELEGRAM_CHAT_ID=${TELEGRAM_CHAT_ID}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    networks:
      - kinezio_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  kinezio_network:
    driver: bridge
EOF
    log "docker-compose.yml создан"
fi

if [ ! -f ".dockerignore" ]; then
    cat > .dockerignore << 'EOF'
node_modules
npm-debug.log*
.next
out
dist
*.log
logs
.tmp
.temp
.vscode
.idea
*.swp
*.swo
.DS_Store
Thumbs.db
.git
.gitignore
Dockerfile
docker-compose.yml
.dockerignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
appointments.db
README.md
*.md
coverage
.nyc_output
ecosystem.config.js
EOF
    log ".dockerignore создан"
fi

# Создание .env файла (только если не существует)
if [ ! -f ".env" ]; then
    log "Создание .env файла..."
    cat > .env << EOF
# Application Settings
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production

# Telegram Bot Settings
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# JWT Secret (сгенерируйте новый)
JWT_SECRET=$(openssl rand -base64 32)
EOF
    warn "Файл .env создан с настройками по умолчанию. Отредактируйте его!"
else
    log "Файл .env уже существует"
fi

# Создание директорий
log "Создание необходимых директорий..."
mkdir -p data logs backups

# Создание скрипта управления
log "Создание скрипта управления..."
cat > manage-docker.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        docker-compose up -d
        echo "Приложение запущено"
        ;;
    stop)
        docker-compose down
        echo "Приложение остановлено"
        ;;
    restart)
        docker-compose restart
        echo "Приложение перезапущено"
        ;;
    status)
        docker-compose ps
        ;;
    logs)
        docker-compose logs -f kinezio_life
        ;;
    build)
        docker-compose build --no-cache
        docker-compose up -d
        echo "Приложение пересобрано и запущено"
        ;;
    backup)
        BACKUP_DIR="./backups"
        mkdir -p $BACKUP_DIR
        docker cp kinezio_life:/app/appointments.db $BACKUP_DIR/appointments_$(date +%Y%m%d_%H%M%S).db 2>/dev/null || echo "База данных не найдена"
        echo "Резервная копия создана в $BACKUP_DIR"
        ;;
    shell)
        docker-compose exec kinezio_life sh
        ;;
    update)
        git pull origin main
        docker-compose build --no-cache
        docker-compose up -d
        echo "Приложение обновлено и перезапущено"
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|build|backup|shell|update}"
        exit 1
        ;;
esac
EOF

chmod +x manage-docker.sh

# Создание скрипта развертывания
log "Создание скрипта развертывания..."
cat > deploy.sh << 'EOF'
#!/bin/bash

echo "🚀 Развертывание Kinezio Life..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

# Создание директорий
mkdir -p data logs backups

# Остановка существующих контейнеров
docker-compose down 2>/dev/null || true

# Сборка и запуск
echo "📦 Сборка образов..."
docker-compose build

echo "🚀 Запуск контейнеров..."
docker-compose up -d

# Ожидание запуска
echo "⏳ Ожидание запуска приложения..."
sleep 10

# Проверка статуса
if docker-compose ps | grep -q "Up"; then
    echo "✅ Приложение успешно запущено!"
    echo "🌐 Доступно по адресу: http://localhost:3000"
else
    echo "❌ Ошибка при запуске приложения"
    echo "📝 Логи:"
    docker-compose logs kinezio_life
fi

echo ""
echo "🔧 Управление:"
echo "  ./manage-docker.sh start    - запустить"
echo "  ./manage-docker.sh stop     - остановить"
echo "  ./manage-docker.sh restart  - перезапустить"
echo "  ./manage-docker.sh status   - статус"
echo "  ./manage-docker.sh logs     - логи"
echo "  ./manage-docker.sh update   - обновить из Git"
EOF

chmod +x deploy.sh

# Настройка Nginx (только если не существует)
log "Настройка Nginx..."
if [ ! -f "$NGINX_SITES_DIR/kinezio_life" ]; then
    sudo tee $NGINX_SITES_DIR/kinezio_life > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    access_log /var/log/nginx/kinezio_life_access.log;
    error_log /var/log/nginx/kinezio_life_error.log;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Таймауты
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Статические файлы Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /api/health {
        proxy_pass http://localhost:3000;
        access_log off;
    }
}
EOF
    log "Конфигурация Nginx создана"
else
    log "Конфигурация Nginx уже существует"
fi

# Активация сайта в Nginx
if [ ! -L "$NGINX_ENABLED_DIR/kinezio_life" ]; then
    sudo ln -sf $NGINX_SITES_DIR/kinezio_life $NGINX_ENABLED_DIR/
    log "Сайт активирован в Nginx"
else
    log "Сайт уже активирован в Nginx"
fi

# Проверка конфигурации Nginx
if sudo nginx -t; then
    sudo systemctl reload nginx
    log "Nginx перезагружен"
else
    warn "Ошибка в конфигурации Nginx"
fi

log "✅ Настройка завершена!"
log "📁 Созданные файлы:"
ls -la

echo ""
echo "📋 Следующие шаги:"
echo "1. Отредактируйте файл .env с вашими настройками:"
echo "   - TELEGRAM_BOT_TOKEN"
echo "   - TELEGRAM_CHAT_ID"
echo "2. Запустите развертывание: ./deploy.sh"
echo "3. Настройте SSL сертификат:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "🔧 Управление приложением:"
echo "  ./manage-docker.sh start    - запустить"
echo "  ./manage-docker.sh stop     - остановить"
echo "  ./manage-docker.sh restart  - перезапустить"
echo "  ./manage-docker.sh status   - статус"
echo "  ./manage-docker.sh logs     - логи"
echo "  ./manage-docker.sh build    - пересобрать"
echo "  ./manage-docker.sh backup   - создать бэкап"
echo "  ./manage-docker.sh update   - обновить из Git"
echo "  ./manage-docker.sh shell    - войти в контейнер"
echo ""
echo "🌐 После настройки приложение будет доступно по адресу:"
echo "  https://$DOMAIN"
