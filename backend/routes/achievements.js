const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');
const { actionLogger } = require('../middleware/logger');

// Получить все достижения
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT * FROM achievements ORDER BY name ASC
    `);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения достижений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новое достижение (только админ)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { name, description, icon, color } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    const [result] = await connection.execute(`
      INSERT INTO achievements (name, description, icon, color, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [name, description, icon, color]);
    
    await connection.end();
    
    actionLogger('CREATE_ACHIEVEMENT', req.user.id, {
      achievementName: name,
      achievementId: result.insertId
    });
    
    res.json({ 
      message: 'Достижение создано', 
      success: true, 
      achievementId: result.insertId 
    });
  } catch (error) {
    console.error('Ошибка создания достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить достижение (только админ)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { name, description, icon, color } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
      UPDATE achievements 
      SET name = ?, description = ?, icon = ?, color = ?, updated_at = NOW()
      WHERE id = ?
    `, [name, description, icon, color, req.params.id]);
    
    await connection.end();
    
    actionLogger('UPDATE_ACHIEVEMENT', req.user.id, {
      achievementId: req.params.id,
      changes: req.body
    });
    
    res.json({ message: 'Достижение обновлено', success: true });
  } catch (error) {
    console.error('Ошибка обновления достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить достижение (только админ)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли пользователи с этим достижением
    const [users] = await connection.execute(
      'SELECT COUNT(*) as count FROM user_achievements WHERE achievement_id = ?', 
      [req.params.id]
    );
    
    if (users[0].count > 0) {
      await connection.end();
      return res.status(400).json({ 
        error: 'Нельзя удалить достижение, которое есть у пользователей' 
      });
    }
    
    await connection.execute('DELETE FROM achievements WHERE id = ?', [req.params.id]);
    await connection.end();
    
    actionLogger('DELETE_ACHIEVEMENT', req.user.id, {
      achievementId: req.params.id
    });
    
    res.json({ message: 'Достижение удалено', success: true });
  } catch (error) {
    console.error('Ошибка удаления достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выдать достижение пользователю (только админ)
router.post('/:id/award', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { user_id, reason } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли уже это достижение у пользователя
    const [existing] = await connection.execute(
      'SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [user_id, req.params.id]
    );
    
    if (existing.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'У пользователя уже есть это достижение' });
    }
    
    await connection.execute(`
      INSERT INTO user_achievements (user_id, achievement_id, awarded_at)
      VALUES (?, ?, NOW())
    `, [user_id, req.params.id]);
    
    await connection.end();
    
    actionLogger('AWARD_ACHIEVEMENT', req.user.id, {
      userId: user_id,
      achievementId: req.params.id,
      reason
    });
    
    res.json({ message: 'Достижение выдано', success: true });
  } catch (error) {
    console.error('Ошибка выдачи достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отозвать достижение у пользователя (только админ)
router.post('/:id/revoke', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { user_id, reason } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
      DELETE FROM user_achievements 
      WHERE user_id = ? AND achievement_id = ?
    `, [user_id, req.params.id]);
    
    await connection.end();
    
    actionLogger('REVOKE_ACHIEVEMENT', req.user.id, {
      userId: user_id,
      achievementId: req.params.id,
      reason
    });
    
    res.json({ message: 'Достижение отозвано', success: true });
  } catch (error) {
    console.error('Ошибка отзыва достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить достижения пользователя
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT 
        a.*, ua.awarded_at
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.awarded_at DESC
    `, [req.params.userId]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения достижений пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
