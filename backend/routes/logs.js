const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getForumLogs, cleanOldLogs } = require('../middleware/forumLogger');

// Получить логи форума (только админ и модератор)
router.get('/forum', authenticateToken, async (req, res) => {
  try {
    // Проверяем права доступа
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { limit = 100, offset = 0, filter = null } = req.query;
    
    const logs = getForumLogs(
      parseInt(limit), 
      parseInt(offset), 
      filter
    );
    
    res.json(logs);
  } catch (error) {
    console.error('Ошибка получения логов форума:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Очистить старые логи (только админ)
router.post('/forum/clean', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { daysToKeep = 30 } = req.body;
    
    cleanOldLogs(daysToKeep);
    
    res.json({ 
      message: `Логи старше ${daysToKeep} дней очищены`, 
      success: true 
    });
  } catch (error) {
    console.error('Ошибка очистки логов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить статистику логов
router.get('/forum/stats', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'moderator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const logs = getForumLogs(1000, 0); // Получаем больше логов для статистики
    
    // Группируем по действиям
    const actionStats = {};
    const userStats = {};
    const hourlyStats = {};
    
    logs.logs.forEach(log => {
      // Статистика по действиям
      actionStats[log.action] = (actionStats[log.action] || 0) + 1;
      
      // Статистика по пользователям
      userStats[log.username] = (userStats[log.username] || 0) + 1;
      
      // Статистика по часам
      const hour = new Date(log.timestamp).getHours();
      hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
    });
    
    // Топ пользователей по активности
    const topUsers = Object.entries(userStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([username, count]) => ({ username, count }));
    
    // Топ действий
    const topActions = Object.entries(actionStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([action, count]) => ({ action, count }));
    
    res.json({
      totalLogs: logs.total,
      topUsers,
      topActions,
      hourlyStats: Object.entries(hourlyStats)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    });
  } catch (error) {
    console.error('Ошибка получения статистики логов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
