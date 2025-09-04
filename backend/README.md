# Arizona DRIP Forum Backend

Backend API для форума Arizona DRIP, написанный на Node.js 18 с MySQL базой данных.

## 🚀 Быстрый старт

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка базы данных
Создайте файл `.env` в папке `backend` со следующим содержимым:

```env
# Настройки сервера
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Настройки MySQL базы данных
MYSQL_HOST=89.169.1.168
MYSQL_PORT=3306
MYSQL_USER=hesus
MYSQL_PASSWORD=
MYSQL_DATABASE=dripforum

# JWT секрет для токенов
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Настройки безопасности
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Запуск сервера
```bash
# Режим разработки
npm run dev

# Продакшн режим
npm start
```

## 📊 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация пользователя
- `POST /api/auth/login` - Вход в систему
- `GET /api/auth/me` - Получение профиля текущего пользователя
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход из системы

### Пользователи
- `GET /api/users` - Список пользователей (модераторы/админы)
- `GET /api/users/:userId` - Профиль пользователя
- `PUT /api/users/:userId` - Обновление профиля
- `PATCH /api/users/:userId/role` - Изменение роли (админы)
- `PATCH /api/users/:userId/status` - Блокировка/разблокировка (модераторы/админы)

### Категории
- `GET /api/categories` - Список всех категорий
- `GET /api/categories/:categoryId` - Категория с темами
- `POST /api/categories` - Создание категории (админы)
- `PUT /api/categories/:categoryId` - Обновление категории (админы)
- `DELETE /api/categories/:categoryId` - Удаление категории (админы)

### Темы
- `GET /api/topics` - Список тем с фильтрацией
- `GET /api/topics/:topicId` - Тема с постами
- `POST /api/topics` - Создание новой темы
- `PUT /api/topics/:topicId` - Обновление темы
- `PATCH /api/topics/:topicId/pin` - Закрепление темы (модераторы)
- `PATCH /api/topics/:topicId/lock` - Блокировка темы (модераторы)
- `DELETE /api/topics/:topicId` - Удаление темы

### Посты
- `GET /api/posts/topic/:topicId` - Посты темы
- `POST /api/posts` - Создание нового поста
- `PUT /api/posts/:postId` - Обновление поста
- `DELETE /api/posts/:postId` - Удаление поста
- `POST /api/posts/:postId/like` - Лайк/анлайк поста
- `GET /api/posts/:postId/likes` - Информация о лайках
- `GET /api/posts/search` - Поиск по постам

### Жалобы
- `GET /api/reports` - Список жалоб (модераторы/админы)
- `POST /api/reports` - Создание жалобы
- `GET /api/reports/:reportId` - Детали жалобы
- `PATCH /api/reports/:reportId/assign` - Назначение модератору
- `PATCH /api/reports/:reportId/resolve` - Разрешение жалобы
- `PATCH /api/reports/:reportId/priority` - Изменение приоритета

### Админ-панель
- `GET /api/admin/stats/overview` - Общая статистика
- `GET /api/admin/stats/daily` - Статистика по дням
- `GET /api/admin/stats/top-users` - Топ пользователей
- `GET /api/admin/settings` - Настройки форума
- `PUT /api/admin/settings` - Обновление настроек
- `GET /api/admin/logs/activity` - Логи активности
- `GET /api/admin/system/info` - Системная информация

## 🗄️ Структура базы данных

При первом запуске сервер автоматически:
1. ✅ Проверит подключение к MySQL
2. ✅ Создаст все необходимые таблицы (если их нет)
3. ✅ Добавит начальные данные (категории, админ-пользователь, настройки)
4. ✅ **НЕ ОЧИСТИТ** существующие данные

### Основные таблицы:
- `users` - Пользователи форума
- `categories` - Категории тем
- `topics` - Темы обсуждений
- `posts` - Посты в темах
- `reports` - Жалобы пользователей
- `bans` - Баны пользователей
- `post_likes` - Лайки постов
- `forum_settings` - Настройки форума

## 🔐 Роли пользователей

- **user** - Обычный пользователь
- **vip** - VIP пользователь
- **moderator** - Модератор
- **admin** - Администратор

## 🛡️ Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Rate limiting для защиты от DDoS
- Валидация всех входных данных
- Проверка прав доступа на уровне middleware

## 📝 Логирование

Сервер логирует:
- Все HTTP запросы
- Ошибки подключения к БД
- Процесс инициализации БД
- Ошибки валидации и аутентификации

## 🚨 Устранение неполадок

### Проблемы с подключением к БД:
1. Проверьте настройки в `.env`
2. Убедитесь что MySQL сервер запущен
3. Проверьте права доступа пользователя `hesus`

### Проблемы с портом:
1. Измените `PORT` в `.env`
2. Убедитесь что порт не занят другим процессом

### Проблемы с JWT:
1. Измените `JWT_SECRET` в `.env`
2. Перезапустите сервер

## 📞 Поддержка

При возникновении проблем проверьте логи сервера и убедитесь что:
- MySQL сервер доступен по адресу `89.169.1.168`
- Пользователь `hesus` имеет доступ к базе `dripforum`
- Все зависимости установлены корректно
