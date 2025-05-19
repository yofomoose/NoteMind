#!/bin/bash

# Скрипт быстрой установки NoteMind
# Используется для запуска через curl

# Параметры
REPO_URL="https://github.com/yofomoose/NoteMind.git"
INSTALL_DIR="./notemind"
MODE="dev"
DETACHED="y"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
echo_message() {
  echo -e "${GREEN}[NoteMind]${NC} $1"
}

echo_warning() {
  echo -e "${YELLOW}[NoteMind]${NC} $1"
}

echo_error() {
  echo -e "${RED}[NoteMind]${NC} $1"
}

# Вывод приветствия
echo_message "NoteMind Quick Install"
echo_message "======================"
echo_message "Этот скрипт установит и запустит NoteMind на вашем сервере."
echo

# Проверка наличия основных утилит
if ! command -v curl &> /dev/null; then
  echo_error "curl не установлен. Пожалуйста, установите его и повторите попытку."
  exit 1
fi

if ! command -v git &> /dev/null; then
  echo_warning "Git не установлен. Установка Git..."
  sudo apt-get update
  sudo apt-get install -y git
  if [ $? -ne 0 ]; then
    echo_error "Не удалось установить Git. Пожалуйста, установите его вручную и повторите попытку."
    exit 1
  fi
fi

# Справка по параметрам
print_usage() {
  echo "Использование: curl -sSL https://raw.githubusercontent.com/yourusername/notemind/main/quickinstall.sh | bash -s -- [параметры]"
  echo
  echo "Параметры:"
  echo "  -r, --repo URL     URL репозитория (по умолчанию: $REPO_URL)"
  echo "  -d, --dir PATH     Директория для установки (по умолчанию: $INSTALL_DIR)"
  echo "  -m, --mode MODE    Режим запуска: dev или prod (по умолчанию: $MODE)"
  echo "  -b, --background   Запустить в фоновом режиме (по умолчанию: да)"
  echo "  -f, --foreground   Запустить в интерактивном режиме"
  echo "  -h, --help         Показать эту справку"
  echo
  echo "Примеры:"
  echo "  curl -sSL https://raw.githubusercontent.com/yourusername/notemind/main/quickinstall.sh | bash"
  echo "  curl -sSL https://raw.githubusercontent.com/yourusername/notemind/main/quickinstall.sh | bash -s -- -m prod"
  echo "  curl -sSL https://raw.githubusercontent.com/yourusername/notemind/main/quickinstall.sh | bash -s -- --dir /opt/notemind --mode prod"
}

# Разбор параметров командной строки
while [[ $# -gt 0 ]]; do
  case "$1" in
    -r|--repo)
      REPO_URL="$2"
      shift 2
      ;;
    -d|--dir)
      INSTALL_DIR="$2"
      shift 2
      ;;
    -m|--mode)
      MODE="$2"
      shift 2
      ;;
    -b|--background)
      DETACHED="y"
      shift
      ;;
    -f|--foreground)
      DETACHED="n"
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo_error "Неизвестный параметр: $1"
      print_usage
      exit 1
      ;;
  esac
done

# Проверка валидности параметров
if [[ "$MODE" != "dev" && "$MODE" != "prod" ]]; then
  echo_error "Неверный режим: $MODE. Допустимые значения: dev, prod"
  exit 1
fi

# Обработка сигналов прерывания
trap 'echo_error "Установка прервана."; exit 1' INT TERM

# Клонирование репозитория
echo_message "Клонирование репозитория из $REPO_URL в $INSTALL_DIR..."

# Создаем директорию, если она не существует
mkdir -p $(dirname "$INSTALL_DIR")

# Проверяем, существует ли директория и не пуста ли она
if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
  echo_warning "Директория $INSTALL_DIR уже существует и не пуста."
  read -p "Очистить директорию перед клонированием? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo_message "Очистка директории $INSTALL_DIR..."
    rm -rf "$INSTALL_DIR"
  else
    echo_error "Установка прервана. Выберите другую директорию или очистите существующую."
    exit 1
  fi
fi

# Клонирование репозитория
git clone "$REPO_URL" "$INSTALL_DIR"
if [ $? -ne 0 ]; then
  echo_error "Не удалось клонировать репозиторий."
  exit 1
fi

# Переход в директорию проекта
cd "$INSTALL_DIR"

# Проверка наличия основного установочного скрипта
if [ ! -f "install.sh" ]; then
  echo_warning "Скрипт install.sh не найден в репозитории."
  echo_message "Загрузка скрипта установки..."
  curl -sSL https://raw.githubusercontent.com/yourusername/notemind/main/install.sh -o install.sh
  chmod +x install.sh
fi

# Запуск основного скрипта установки
echo_message "Запуск установки NoteMind..."
chmod +x install.sh
./install.sh

# Проверка наличия Docker и Docker Compose
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo_error "Docker или Docker Compose не установлены."
  echo_message "Пожалуйста, установите Docker и Docker Compose и повторите запуск скрипта."
  exit 1
fi

# Запуск приложения
echo_message "Запуск NoteMind в режиме $MODE..."

# Определение команды запуска
if [[ "$MODE" == "prod" ]]; then
  if [[ "$DETACHED" == "y" ]]; then
    docker-compose up -d
  else
    docker-compose up
  fi
else
  if [[ "$DETACHED" == "y" ]]; then
    docker-compose -f docker-compose.dev.yml up -d
  else
    docker-compose -f docker-compose.dev.yml up
  fi
fi

if [ $? -ne 0 ]; then
  echo_error "Не удалось запустить приложение."
  exit 1
fi

# Определение портов
CLIENT_PORT=$(grep -oP '"(\d+):80"' docker-compose.yml | grep -oP '\d+' | head -1)
CLIENT_PORT=${CLIENT_PORT:-3000}

API_PORT=$(grep -oP '"(\d+):5000"' docker-compose.yml | grep -oP '\d+' | head -1)
API_PORT=${API_PORT:-5000}

# Вывод информации о доступе к приложению
echo_message "Приложение NoteMind успешно установлено и запущено!"
echo_message "Веб-интерфейс доступен по адресу: http://localhost:$CLIENT_PORT"
echo_message "API сервер доступен по адресу: http://localhost:$API_PORT"

if [[ "$DETACHED" == "y" ]]; then
  echo_message "Для просмотра логов используйте команду: docker-compose logs -f"
fi

echo
echo_message "Спасибо за установку NoteMind!"
exit 0