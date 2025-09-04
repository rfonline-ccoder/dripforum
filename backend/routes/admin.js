const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../database/config');
const { 
  authenticateToken, 
  requireRole, 
  updateLastActivity 
} = require('../middleware/auth');

const router = express.Router();

// Все роуты требуют роль админа
router.use(authenticateToken, requireRole(['admin']), updateLastActivity);

// Получение общей статистики форума
router.get('/stats/overview', async (req, res) => {
  try {
    // Статистика пользователей
    const usersStats = await query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'banned' THEN 1 END) as banned_users,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'moderator' THEN 1 END) as moderator_users,
        COUNT(CASE WHEN role = 'vip' THEN 1 END) as vip_users,
        COUNT(CASE WHEN DATE(join_date) = CURDATE() THEN 1 END) as today_registrations,
        COUNT(CASE WHEN join_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_registrations
      FROM users
    `);

    // Статистика контента
    const contentStats = await query(`
      SELECT 
        COUNT(DISTINCT t.id) as total_topics,
        COUNT(DISTINCT p.id) as total_posts,
        COUNT(DISTINCT c.id) as total_categories,
        COUNT(CASE WHEN t.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_topics,
        COUNT(CASE WHEN p.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_posts
      FROM topics t
      CROSS JOIN posts p
      CROSS JOIN categories c
    `);

    // Статистика активности
    const activityStats = await query(`
      SELECT 
        COUNT(CASE WHEN DATE(last_activity) = CURDATE() THEN 1 END) as today_active_users,
        COUNT(CASE WHEN last_activity >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_active_users,
        COUNT(CASE WHEN last_activity >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as month_active_users
      FROM users
      WHERE status = 'active'
    `);

    // Статистика жалоб
    const reportsStats = await query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reports,
        COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_reports,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reports,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_reports
      FROM reports
    `);

    res.json({
      users: usersStats[0],
      content: contentStats[0],
      activity: activityStats[0],
      reports: reportsStats[0]
    });

  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики форума' });
  }
});

// Получение статистики по дням
router.get('/stats/daily', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    // Регистрации по дням
    const registrations = await query(`
      SELECT DATE(join_date) as date, COUNT(*) as count
      FROM users
      WHERE join_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(join_date)
      ORDER BY date DESC
    `, [days]);

    // Посты по дням
    const posts = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM posts
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    // Темы по дням
    const topics = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM topics
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [days]);

    // Активные пользователи по дням
    const activeUsers = await query(`
      SELECT DATE(last_activity) as date, COUNT(*) as count
      FROM users
      WHERE last_activity >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND status = 'active'
      GROUP BY DATE(last_activity)
      ORDER BY date DESC
    `, [days]);

    res.json({
      registrations,
      posts,
      topics,
      activeUsers
    });

  } catch (error) {
    console.error('Ошибка получения дневной статистики:', error);
    res.status(500).json({ error: 'Ошибка получения дневной статистики' });
  }
});

// Получение топ пользователей
router.get('/stats/top-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Топ по количеству постов
    const topPosters = await query(`
      SELECT username, posts_count, topics_count, reputation, join_date
      FROM users
      WHERE status = 'active'
      ORDER BY posts_count DESC
      LIMIT ?
    `, [limit]);

    // Топ по репутации
    const topReputation = await query(`
      SELECT username, reputation, posts_count, topics_count, join_date
      FROM users
      WHERE status = 'active'
      ORDER BY reputation DESC
      LIMIT ?
    `, [limit]);

    // Топ по активности
    const topActive = await query(`
      SELECT username, last_activity, posts_count, topics_count, reputation
      FROM users
      WHERE status = 'active' AND last_activity >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY last_activity DESC
      LIMIT ?
    `, [limit]);

    res.json({
      topPosters,
      topReputation,
      topActive
    });

  } catch (error) {
    console.error('Ошибка получения топ пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения топ пользователей' });
  }
});

// Получение настроек форума
router.get('/settings', async (req, res) => {
  try {
    const settings = await query(`
      SELECT setting_key, setting_value, setting_type, description
      FROM forum_settings
      ORDER BY setting_key
    `);

    res.json({ settings });

  } catch (error) {
    console.error('Ошибка получения настроек:', error);
    res.status(500).json({ error: 'Ошибка получения настроек форума' });
  }
});

// Обновление настроек форума
router.put('/settings', [
  body('settings').isArray().withMessage('Настройки должны быть массивом'),
  body('settings.*.setting_key').isString().withMessage('Ключ настройки обязателен'),
  body('settings.*.setting_value').notEmpty().withMessage('Значение настройки обязательно')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { settings } = req.body;

    // Обновляем каждую настройку
    for (const setting of settings) {
      await query(`
        UPDATE forum_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ?
      `, [setting.setting_value, setting.setting_key]);
    }

    res.json({ message: 'Настройки форума обновлены успешно' });

  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
    res.status(500).json({ error: 'Ошибка обновления настроек форума' });
  }
});

// Получение логов активности
router.get('/logs/activity', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const days = parseInt(req.query.days) || 7;

    // Получаем активность пользователей
    const activityLogs = await query(`
      SELECT u.username, u.role, u.last_activity, u.posts_count, u.topics_count
      FROM users u
      WHERE u.last_activity >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ORDER BY u.last_activity DESC
      LIMIT ? OFFSET ?
    `, [days, limit, offset]);

    // Общее количество
    const totalResult = await query(`
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.last_activity >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [days]);

    res.json({
      logs: activityLogs,
      pagination: {
        page,
        limit,
        total: totalResult[0].total,
        pages: Math.ceil(totalResult[0].total / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения логов активности:', error);
    res.status(500).json({ error: 'Ошибка получения логов активности' });
  }
});

// Получение системной информации
router.get('/system/info', async (req, res) => {
  try {
    // Информация о базе данных
    const dbInfo = await query(`
      SELECT 
        TABLE_SCHEMA as database_name,
        COUNT(*) as total_tables,
        SUM(TABLE_ROWS) as total_rows,
        SUM(DATA_LENGTH + INDEX_LENGTH) as total_size_bytes
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      GROUP BY TABLE_SCHEMA
    `, [process.env.MYSQL_DATABASE || 'dripforum']);

    // Размер таблиц
    const tableSizes = await query(`
      SELECT 
        TABLE_NAME as table_name,
        TABLE_ROWS as rows,
        DATA_LENGTH as data_size,
        INDEX_LENGTH as index_size
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `, [process.env.MYSQL_DATABASE || 'dripforum']);

    // Статус соединений
    const connectionStatus = await query('SHOW STATUS LIKE "Threads_connected"');
    const maxConnections = await query('SHOW VARIABLES LIKE "max_connections"');

    res.json({
      database: dbInfo[0] || {},
      tableSizes,
      connections: {
        current: connectionStatus[0]?.Value || 0,
        max: maxConnections[0]?.Value || 0
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        env: process.env.NODE_ENV || 'development'
      }
    });

  } catch (error) {
    console.error('Ошибка получения системной информации:', error);
    res.status(500).json({ error: 'Ошибка получения системной информации' });
  }
});

// Очистка старых данных
router.post('/maintenance/cleanup', [
  body('days').isInt({ min: 1, max: 365 }).withMessage('Количество дней должно быть от 1 до 365'),
  body('tables').isArray().withMessage('Таблицы должны быть массивом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { days, tables } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let cleanedCount = 0;

    // Очищаем указанные таблицы
    for (const table of tables) {
      switch (table) {
        case 'reports':
          if (['resolved', 'rejected'].includes(req.query.status)) {
            const result = await query(`
              DELETE FROM reports 
              WHERE status IN ('resolved', 'rejected') 
              AND created_at < ?
            `, [cutoffDate]);
            cleanedCount += result.affectedRows || 0;
          }
          break;

        case 'post_likes':
          const result = await query(`
            DELETE FROM post_likes 
            WHERE created_at < ?
          `, [cutoffDate]);
          cleanedCount += result.affectedRows || 0;
          break;

        case 'bans':
          if (req.query.expired === 'true') {
            const result = await query(`
              DELETE FROM bans 
              WHERE expires_at IS NOT NULL 
              AND expires_at < NOW()
            `);
            cleanedCount += result.affectedRows || 0;
          }
          break;
      }
    }

    res.json({ 
      message: 'Очистка завершена успешно',
      cleanedCount,
      cutoffDate: cutoffDate.toISOString()
    });

  } catch (error) {
    console.error('Ошибка очистки данных:', error);
    res.status(500).json({ error: 'Ошибка очистки данных' });
  }
});

// Резервное копирование базы данных (симуляция)
router.post('/backup/create', async (req, res) => {
  try {
    // В реальном приложении здесь был бы код для создания бэкапа
    const backupInfo = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      status: 'created',
      size: '0 MB',
      tables: ['users', 'categories', 'topics', 'posts', 'reports', 'bans']
    };

    res.json({
      message: 'Резервная копия создана успешно',
      backup: backupInfo
    });

  } catch (error) {
    console.error('Ошибка создания резервной копии:', error);
    res.status(500).json({ error: 'Ошибка создания резервной копии' });
  }
});

// Получение списка резервных копий
router.get('/backup/list', async (req, res) => {
  try {
    // В реальном приложении здесь был бы код для получения списка бэкапов
    const backups = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        size: '2.5 MB',
        tables: ['users', 'categories', 'topics', 'posts', 'reports', 'bans']
      }
    ];

    res.json({ backups });

  } catch (error) {
    console.error('Ошибка получения списка резервных копий:', error);
    res.status(500).json({ error: 'Ошибка получения списка резервных копий' });
  }
});

module.exports = router;
