#!/bin/bash

# Скрипт развертывания Kinezio Life через Docker
# Использование: ./docker-deploy.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции для вывода
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

# Проверка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен! Установите Docker сначала."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен! Установите Docker Compose сначала."
    fi
    
    log "Docker и Docker Compose найдены"
}

# Создание директорий
create_directories() {
    log "Создание необходимых директорий..."
    
    mkdir -p data
    mkdir -p logs
    mkdir -p ssl
    
    log "Директории созданы"
}

# Создание .env файла
create_env_file() {
    if [ ! -f ".env" ]; then
        log "Создание файла .env..."
        
        cat > .env << EOF
# Application Settings
NEXT_PUBLIC_APP_URL=https://your-domain.com
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
}

# Сборка и запуск контейнеров
build_and_start() {
    log "Остановка существующих контейнеров..."
    docker-compose down 2>/dev/null || true
    
    log "Сборка образов..."
    docker-compose build --no-cache
    
    log "Запуск контейнеров..."
    docker-compose up -d
    
    log "Ожидание запуска приложения..."
    sleep 10
    
    # Проверка статуса
    if docker-compose ps | grep -q "Up"; then
        log "✅ Приложение успешно запущено!"
    else
        error "❌ Ошибка при запуске приложения"
    fi
}

# Проверка здоровья приложения
health_check() {
    log "Проверка здоровья приложения..."
    
    # Ждем запуска
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health 2>/dev/null; then
            log "✅ Приложение работает!"
            return 0
        fi
        sleep 2
    done
    
    warn "⚠️ Приложение не отвечает на health check"
    return 1
}

# Показать статус
show_status() {
    log "Статус контейнеров:"
    docker-compose ps
    
    log "Логи приложения:"
    docker-compose logs --tail=20 kinezio_life
}

# Создание скрипта управления
create_management_script() {
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
        docker cp kinezio_life:/app/appointments.db $BACKUP_DIR/appointments_$(date +%Y%m%d_%H%M%S).db
        echo "Резервная копия создана в $BACKUP_DIR"
        ;;
    shell)
        docker-compose exec kinezio_life sh
        ;;
    *)
        echo "Использование: $0 {start|stop|restart|status|logs|build|backup|shell}"
        exit 1
        ;;
esac
EOF
    
    chmod +x manage-docker.sh
    log "Скрипт управления создан: ./manage-docker.sh"
}

# Основная функция
main() {
    log "🚀 Начинаем развертывание Kinezio Life через Docker..."
    
    check_docker
    create_directories
    create_env_file
    build_and_start
    health_check
    show_status
    create_management_script
    
    log "✅ Развертывание завершено!"
    
    echo ""
    echo "📋 Следующие шаги:"
    echo "1. Отредактируйте файл .env с вашими настройками"
    echo "2. Настройте Telegram бота"
    echo "3. Настройте домен в DNS"
    echo "4. Настройте SSL сертификаты в директории ./ssl/"
    echo ""
    echo "🔧 Управление приложением:"
    echo "  ./manage-docker.sh start    - запустить"
    echo "  ./manage-docker.sh stop     - остановить"
    echo "  ./manage-docker.sh restart  - перезапустить"
    echo "  ./manage-docker.sh status   - статус"
    echo "  ./manage-docker.sh logs     - логи"
    echo "  ./manage-docker.sh build    - пересобрать"
    echo "  ./manage-docker.sh backup   - создать бэкап"
    echo "  ./manage-docker.sh shell    - войти в контейнер"
    echo ""
    echo "🌐 Приложение доступно по адресу:"
    echo "  http://localhost:3000"
    echo ""
    echo "📝 Логи приложения:"
    echo "  docker-compose logs -f kinezio_life"
}

# Запуск
main "$@"
