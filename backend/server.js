const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
// Загружаем конфигурацию в зависимости от окружения
let config;
try {
  config = require('./config.local.json');
  console.log('📁 Загружена локальная конфигурация');
} catch (error) {
  config = require('./config.json');
  console.log('📁 Загружена основная конфигурация');
}

const { requestLogger, errorLogger } = require('./middleware/logger');
const { initializeData } = require('./init-data');
const { updateCategoriesPermissionsTable } = require('./update-categories-permissions');
const mysql = require('mysql2/promise');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const topicRoutes = require('./routes/topics');
const postRoutes = require('./routes/posts');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = config.server.port;

// Middleware безопасности
app.use(helmet());

// CORS настройки
app.use(cors({
  origin: config.cors.frontendUrl,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Слишком много запросов с этого IP, попробуйте позже'
});

// Более мягкий rate limiting для auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 50, // 50 запросов за 15 минут
  message: 'Слишком много попыток входа, попробуйте позже'
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Логирование запросов
app.use(requestLogger);

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rules', require('./routes/rules'));
app.use('/api/usergroups', require('./routes/usergroups'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/profile-comments', require('./routes/profile-comments'));
app.use('/api/logs', require('./routes/logs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Обработка ошибок
app.use(errorLogger);
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Внутренняя ошибка сервера',
    message: config.server.nodeEnv === 'development' ? err.message : undefined
  });
});

// 404 для несуществующих роутов
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Функция для создания таблицы user_groups_membership
const createUserGroupsMembershipTable = async () => {
  try {
    console.log('🔧 Проверяем таблицу user_groups_membership...');
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, существует ли таблица
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_groups_membership'
    `, [config.database.database]);
    
    if (tables.length === 0) {
      console.log('📝 Создаем таблицу user_groups_membership...');
      
      await connection.execute(`
        CREATE TABLE user_groups_membership (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          group_id INT NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_by VARCHAR(36),
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE KEY unique_user_group (user_id, group_id),
          INDEX idx_user_id (user_id),
          INDEX idx_group_id (group_id),
          INDEX idx_assigned_at (assigned_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Таблица user_groups_membership создана!');
    } else {
      console.log('✅ Таблица user_groups_membership уже существует');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы user_groups_membership:', error.message);
  }
};

// Функция для обновления таблицы user_achievements
const updateUserAchievementsTable = async () => {
  try {
    console.log('🔧 Проверяем таблицу user_achievements...');
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли поля awarded_by и reason
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_achievements' AND COLUMN_NAME IN ('awarded_by', 'reason')
    `, [config.database.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('awarded_by')) {
      console.log('📝 Добавляем поле awarded_by в user_achievements...');
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD COLUMN awarded_by VARCHAR(36) AFTER awarded_at,
        ADD FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Поле awarded_by добавлено!');
    }
    
    if (!existingColumns.includes('reason')) {
      console.log('📝 Добавляем поле reason в user_achievements...');
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD COLUMN reason TEXT AFTER awarded_by
      `);
      console.log('✅ Поле reason добавлено!');
    }
    
    if (existingColumns.includes('awarded_by') && existingColumns.includes('reason')) {
      console.log('✅ Таблица user_achievements уже обновлена');
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Ошибка при обновлении таблицы user_achievements:', error.message);
  }
};

// Запуск сервера
async function startServer() {
  try {
    console.log('🔌 Проверка подключения к базе данных...');
    
    // Простая проверка подключения
    const connection = await mysql.createConnection(config.database);
    await connection.ping();
    await connection.end();
    
    console.log('✅ Подключение к базе данных успешно');
    
    // Создаем таблицу user_groups_membership если её нет
    await createUserGroupsMembershipTable();
    
    // Обновляем таблицу user_achievements если нужно
    await updateUserAchievementsTable();
    
    // Обновляем таблицу categories с правами доступа
    await updateCategoriesPermissionsTable();
    
    // Инициализируем стандартные данные
    console.log('🎯 Инициализация стандартных данных...');
    await initializeData();
    
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📊 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Логи сохраняются в: backend/logs/logs.log`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
