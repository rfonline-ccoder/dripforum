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
app.use('/api/', limiter);

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

// Запуск сервера
async function startServer() {
  try {
    console.log('🔌 Проверка подключения к базе данных...');
    
    // Простая проверка подключения
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection(config.database);
    await connection.ping();
    await connection.end();
    
    console.log('✅ Подключение к базе данных успешно');
    
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
