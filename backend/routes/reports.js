const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');
const { actionLogger } = require('../middleware/logger');
const { logForumAction } = require('../middleware/forumLogger');

// Подключение к базе данных
const getConnection = async () => {
  return await mysql.createConnection(config.database);
};

// Получить все жалобы
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [reports] = await connection.execute(`
      SELECT 
        r.id,
        r.reason,
        r.priority,
        r.status,
        r.description,
        r.created_at,
        r.updated_at,
        reporter.username as reporter_username,
        reported.username as reported_username,
        moderator.username as moderator_username,
        r.assigned_moderator_id
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users moderator ON r.assigned_moderator_id = moderator.id
      ORDER BY r.created_at DESC
    `);

    await connection.end();
    
    res.json(reports);
  } catch (error) {
    console.error('Ошибка получения жалоб:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить жалобу по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [reports] = await connection.execute(`
      SELECT 
        r.*,
        reporter.username as reporter_username,
        reported.username as reported_username,
        moderator.username as moderator_username
      FROM reports r
      JOIN users reporter ON r.reporter_id = reporter.id
      JOIN users reported ON r.reported_user_id = reported.id
      LEFT JOIN users moderator ON r.assigned_moderator_id = moderator.id
      WHERE r.id = ?
    `, [req.params.id]);

    await connection.end();

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Жалоба не найдена' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Ошибка получения жалобы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новую жалобу
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { reported_user_id, reason, description, content_type, reported_content_id } = req.body;
    const reporter_id = req.user.id;

    if (!reported_user_id || !reason) {
      return res.status(400).json({ error: 'Необходимо указать пользователя и причину' });
    }

    const connection = await getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO reports (reporter_id, reported_user_id, reason, description, content_type, reported_content_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [reporter_id, reported_user_id, reason, description, content_type || 'user', reported_content_id]);

    await connection.end();
    
    // Логируем создание жалобы
    logForumAction('REPORT_CREATE', req.user.id, req.user.username, {
      reportId: result.insertId,
      reportedUserId: reported_user_id,
      reason: reason,
      contentType: content_type
    });

    res.status(201).json({
      id: result.insertId,
      message: 'Жалоба успешно создана' 
    });
  } catch (error) {
    console.error('Ошибка создания жалобы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить статус жалобы
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const reportId = req.params.id;

    if (!status || !['pending', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const connection = await getConnection();
    
    await connection.execute(`
      UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [status, reportId]);

    await connection.end();
    
    // Логируем действие
    actionLogger('UPDATE_REPORT_STATUS', req.user.id, {
      reportId,
      oldStatus: 'unknown',
      newStatus: status
    });
    
    // Логируем в форум
    logForumAction('REPORT_STATUS_UPDATE', req.user.id, req.user.username, {
      reportId: reportId,
      newStatus: status
    });
    
    res.json({ message: 'Статус жалобы обновлен', success: true });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Назначить модератора
router.patch('/:id/assign', authenticateToken, async (req, res) => {
  try {
    const { moderator_id } = req.body;
    const reportId = req.params.id;

    if (!moderator_id) {
      return res.status(400).json({ error: 'Необходимо указать модератора' });
    }

    const connection = await getConnection();
    
    // Проверяем, что пользователь действительно модератор
    const [moderators] = await connection.execute(`
      SELECT id FROM users WHERE id = ? AND role = 'moderator'
    `, [moderator_id]);

    if (moderators.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'Пользователь не является модератором' });
    }

    await connection.execute(`
      UPDATE reports SET assigned_moderator_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [moderator_id, reportId]);

    await connection.end();
    
    // Логируем действие
    actionLogger('ASSIGN_MODERATOR', req.user.id, {
      reportId,
      moderatorId: moderator_id
    });
    
    // Логируем в форум
    logForumAction('REPORT_ASSIGN_MODERATOR', req.user.id, req.user.username, {
      reportId: reportId,
      moderatorId: moderator_id
    });
    
    res.json({ message: 'Модератор назначен', success: true });
  } catch (error) {
    console.error('Ошибка назначения модератора:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить модераторов для назначения
router.get('/moderators/list', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [moderators] = await connection.execute(`
      SELECT id, username, email FROM users WHERE role = 'moderator' AND status = 'active'
    `);

    await connection.end();
    
    res.json(moderators);
  } catch (error) {
    console.error('Ошибка получения списка модераторов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить жалобу
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const reportId = req.params.id;
    const connection = await getConnection();
    
    await connection.execute('DELETE FROM reports WHERE id = ?', [reportId]);
    await connection.end();
    
    res.json({ message: 'Жалоба удалена' });
  } catch (error) {
    console.error('Ошибка удаления жалобы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
