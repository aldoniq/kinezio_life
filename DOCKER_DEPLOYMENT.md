# Развертывание Kinezio Life через Docker

## 🐳 Преимущества Docker развертывания

- **Изоляция**: Приложение работает в изолированной среде
- **Портабельность**: Легко переносить между серверами
- **Версионность**: Возможность отката к предыдущим версиям
- **Масштабируемость**: Легко масштабировать и балансировать нагрузку
- **Управление**: Простое управление через Docker Compose

## 📋 Требования к серверу

### Минимальные требования:
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 2GB (рекомендуется 4GB+)
- **Диск**: 20GB свободного места
- **Docker**: версия 20.10+
- **Docker Compose**: версия 2.0+

## 🚀 Быстрое развертывание

### 1. Установка Docker (если не установлен)

```bash
# Запуск скрипта установки Docker
chmod +x docker-install.sh
./docker-install.sh

# Перезайдите в систему или выполните:
newgrp docker
```

### 2. Загрузка проекта на сервер

```bash
# Создание директории
sudo mkdir -p /var/www/kinezio_life
sudo chown $USER:$USER /var/www/kinezio_life
cd /var/www/kinezio_life

# Загрузка файлов (выберите один способ):

# Способ A: SCP с локального компьютера
scp -r /path/to/local/kinezio_life/* user@server:/var/www/kinezio_life/

# Способ B: Git clone
git clone https://github.com/your-username/kinezio_life.git .

# Способ C: Архив
wget https://your-domain.com/kinezio_life.tar.gz
tar -xzf kinezio_life.tar.gz
```

### 3. Автоматическое развертывание

```bash
# Переход в директорию проекта
cd /var/www/kinezio_life

# Запуск автоматического развертывания
chmod +x docker-deploy.sh
./docker-deploy.sh
```

## ⚙️ Ручная настройка

### 1. Создание файла .env

```bash
nano .env
```

Содержимое:
```env
# Application Settings
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Telegram Bot Settings
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# JWT Secret (сгенерируйте новый)
JWT_SECRET=your_super_secret_jwt_key_here
```

### 2. Сборка и запуск

```bash
# Сборка образов
docker-compose build

# Запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

### 3. Настройка Nginx (опционально)

```bash
# Создание SSL сертификатов
mkdir -p ssl
# Поместите ваши SSL сертификаты в директорию ssl/
# cert.pem - сертификат
# key.pem - приватный ключ
```

## 🔧 Управление приложением

### Основные команды

```bash
# Запуск
./manage-docker.sh start

# Остановка
./manage-docker.sh stop

# Перезапуск
./manage-docker.sh restart

# Статус
./manage-docker.sh status

# Логи
./manage-docker.sh logs

# Пересборка
./manage-docker.sh build

# Резервное копирование
./manage-docker.sh backup

# Вход в контейнер
./manage-docker.sh shell
```

### Docker Compose команды

```bash
# Просмотр логов
docker-compose logs -f kinezio_life

# Перезапуск сервиса
docker-compose restart kinezio_life

# Обновление образов
docker-compose pull
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Остановка с удалением volumes
docker-compose down -v
```

## 📊 Мониторинг

### Проверка статуса

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Логи приложения
docker-compose logs -f kinezio_life

# Логи Nginx
docker-compose logs -f nginx
```

### Health Check

```bash
# Проверка здоровья приложения
curl http://localhost:3000/api/health

# Проверка через Nginx
curl http://localhost/api/health
```

## 🔒 Безопасность

### Настройка файрвола

```bash
# Разрешить только необходимые порты
sudo ufw allow 22    # SSH
sudo ufw allow 80   # HTTP
sudo ufw allow 443  # HTTPS
sudo ufw enable
```

### Обновление контейнеров

```bash
# Обновление образов
docker-compose pull

# Пересборка с обновлениями
docker-compose build --no-cache
docker-compose up -d
```

## 📦 Резервное копирование

### Автоматическое резервное копирование

```bash
# Создание бэкапа
./manage-docker.sh backup

# Восстановление из бэкапа
docker cp backups/appointments_20240101_120000.db kinezio_life:/app/appointments.db
docker-compose restart kinezio_life
```

### Настройка cron для автоматических бэкапов

```bash
# Добавление в crontab
crontab -e

# Добавить строку для ежедневного бэкапа в 2:00
0 2 * * * cd /var/www/kinezio_life && ./manage-docker.sh backup
```

## 🚨 Устранение неполадок

### Приложение не запускается

```bash
# Проверка логов
docker-compose logs kinezio_life

# Проверка конфигурации
docker-compose config

# Пересборка
docker-compose build --no-cache
```

### Проблемы с базой данных

```bash
# Проверка файлов базы данных
ls -la data/

# Восстановление прав доступа
sudo chown -R $USER:$USER data/
```

### Проблемы с Nginx

```bash
# Проверка конфигурации Nginx
docker-compose exec nginx nginx -t

# Перезапуск Nginx
docker-compose restart nginx
```

### Очистка Docker

```bash
# Удаление неиспользуемых образов
docker system prune -a

# Удаление неиспользуемых volumes
docker volume prune

# Полная очистка
docker system prune -a --volumes
```

## 📈 Масштабирование

### Горизонтальное масштабирование

```bash
# Увеличение количества экземпляров
docker-compose up -d --scale kinezio_life=3

# Настройка load balancer в nginx.conf
```

### Вертикальное масштабирование

```yaml
# В docker-compose.yml добавить ограничения ресурсов
services:
  kinezio_life:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
```

## 🔄 Обновление приложения

### Процесс обновления

```bash
# 1. Остановка приложения
./manage-docker.sh stop

# 2. Создание бэкапа
./manage-docker.sh backup

# 3. Обновление кода
git pull  # или загрузка новых файлов

# 4. Пересборка
./manage-docker.sh build

# 5. Запуск
./manage-docker.sh start

# 6. Проверка
./manage-docker.sh status
```

## 📝 Полезные команды

```bash
# Просмотр всех контейнеров
docker ps -a

# Просмотр всех образов
docker images

# Удаление неиспользуемых ресурсов
docker system prune

# Просмотр использования диска
docker system df

# Мониторинг в реальном времени
docker stats
```
