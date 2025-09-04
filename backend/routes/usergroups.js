const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');
const { actionLogger } = require('../middleware/logger');

// Получить все группы пользователей
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT * FROM user_groups ORDER BY name ASC
    `);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения групп:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новую группу (только админ)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { name, color, css_styles, permissions } = req.body;
    const connection = await mysql.createConnection(config.database);
    
          const [result] = await connection.execute(`
        INSERT INTO user_groups (name, color, css_styles, permissions, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [name, color, css_styles, permissions]);
    
    await connection.end();
    
    actionLogger('CREATE_USER_GROUP', req.user.id, {
      groupName: name,
      groupId: result.insertId
    });
    
    res.json({ 
      message: 'Группа создана', 
      success: true, 
      groupId: result.insertId 
    });
  } catch (error) {
    console.error('Ошибка создания группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить группу (только админ)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const { name, color, css_styles, permissions } = req.body;
    const connection = await mysql.createConnection(config.database);
    
          await connection.execute(`
        UPDATE user_groups 
        SET name = ?, color = ?, css_styles = ?, permissions = ?, updated_at = NOW()
        WHERE id = ?
      `, [name, color, css_styles, permissions, req.params.id]);
    
    await connection.end();
    
    actionLogger('UPDATE_USER_GROUP', req.user.id, {
      groupId: req.params.id,
      changes: req.body
    });
    
    res.json({ message: 'Группа обновлена', success: true });
  } catch (error) {
    console.error('Ошибка обновления группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить группу (только админ)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли пользователи в этой группе
    const [users] = await connection.execute(
      'SELECT COUNT(*) as count FROM users WHERE group_id = ?', 
      [req.params.id]
    );
    
    if (users[0].count > 0) {
      await connection.end();
      return res.status(400).json({ 
        error: 'Нельзя удалить группу, в которой есть пользователи' 
      });
    }
    
    await connection.execute('DELETE FROM user_groups WHERE id = ?', [req.params.id]);
    await connection.end();
    
    actionLogger('DELETE_USER_GROUP', req.user.id, {
      groupId: req.params.id
    });
    
    res.json({ message: 'Группа удалена', success: true });
  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить группу по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(
      'SELECT * FROM user_groups WHERE id = ?', 
      [req.params.id]
    );
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    await connection.end();
    res.json(rows[0]);
  } catch (error) {
    console.error('Ошибка получения группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
