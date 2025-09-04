# Настройка MySQL для DripForum

## 1. Установка MySQL

### Windows:
1. Скачайте MySQL Installer с официального сайта
2. Запустите установщик и выберите "Developer Default"
3. Установите MySQL Server и MySQL Workbench

### macOS:
```bash
brew install mysql
brew services start mysql
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

## 2. Запуск MySQL сервиса

### Windows:
```cmd
net start mysql80
```

### macOS:
```bash
brew services start mysql
```

### Linux:
```bash
sudo systemctl start mysql
```

## 3. Первоначальная настройка

```bash
# Подключение к MySQL
mysql -u root -p

# Создание базы данных
CREATE DATABASE dripforum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Создание пользователя (опционально)
CREATE USER 'dripforum_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON dripforum.* TO 'dripforum_user'@'localhost';
FLUSH PRIVILEGES;

# Выход
EXIT;
```

## 4. Тестирование подключения

```bash
# В папке backend
node test-db.js
```

## 5. Обновление конфигурации

Если у вас другой пароль или настройки, отредактируйте `config.local.json`:

```json
{
  "database": {
    "host": "127.0.0.1",
    "user": "root",
    "password": "ваш_пароль",
    "name": "dripforum",
    "port": 3306
  }
}
```

## 6. Запуск сервера

```bash
# В папке backend
npm start
```

## Возможные проблемы:

1. **MySQL не запущен** - проверьте статус сервиса
2. **Неверный пароль** - сбросьте пароль root
3. **Порт занят** - измените порт в конфигурации
4. **Firewall** - разрешите подключения к порту 3306
