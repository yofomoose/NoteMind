# Makefile для управления проектом NoteMind

# Переменные
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml

# Запуск в режиме разработки
dev:
	$(DOCKER_COMPOSE_DEV) up

# Запуск в режиме разработки (в фоновом режиме)
dev-detach:
	$(DOCKER_COMPOSE_DEV) up -d

# Остановка контейнеров разработки
dev-down:
	$(DOCKER_COMPOSE_DEV) down

# Запуск в production режиме
prod:
	$(DOCKER_COMPOSE) up

# Запуск в production режиме (в фоновом режиме)
prod-detach:
	$(DOCKER_COMPOSE) up -d

# Остановка production контейнеров
prod-down:
	$(DOCKER_COMPOSE) down

# Остановка и удаление всех данных (включая volumes)
clean:
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE_DEV) down -v

# Пересборка контейнеров
rebuild:
	$(DOCKER_COMPOSE) build --no-cache

# Пересборка контейнеров разработки
rebuild-dev:
	$(DOCKER_COMPOSE_DEV) build --no-cache

# Логи production
logs:
	$(DOCKER_COMPOSE) logs -f

# Логи dev
logs-dev:
	$(DOCKER_COMPOSE_DEV) logs -f

# Запуск тестов
test:
	cd client && npm test
	cd server && npm test

# Установка зависимостей для всего проекта
install:
	npm install
	cd client && npm install
	cd server && npm install

# Справка
help:
	@echo "Доступные команды:"
	@echo "  make dev           - Запуск в режиме разработки"
	@echo "  make dev-detach    - Запуск в режиме разработки (в фоновом режиме)"
	@echo "  make dev-down      - Остановка контейнеров разработки"
	@echo "  make prod          - Запуск в production режиме"
	@echo "  make prod-detach   - Запуск в production режиме (в фоновом режиме)"
	@echo "  make prod-down     - Остановка production контейнеров"
	@echo "  make clean         - Остановка и удаление всех данных"
	@echo "  make rebuild       - Пересборка production контейнеров"
	@echo "  make rebuild-dev   - Пересборка контейнеров разработки"
	@echo "  make logs          - Просмотр логов production"
	@echo "  make logs-dev      - Просмотр логов разработки"
	@echo "  make test          - Запуск тестов"
	@echo "  make install       - Установка зависимостей"

.PHONY: dev dev-detach dev-down prod prod-detach prod-down clean rebuild rebuild-dev logs logs-dev test install help