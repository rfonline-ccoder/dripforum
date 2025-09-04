const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');

// Подключение к базе данных
const getConnection = async () => {
  return await mysql.createConnection(config.database);
};

// Получить все правила
router.get('/', async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [rules] = await connection.execute(`
      SELECT * FROM rules ORDER BY priority DESC, created_at DESC
    `);

    await connection.end();
    
    res.json(rules);
  } catch (error) {
    console.error('Ошибка получения правил:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить правило по ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [rules] = await connection.execute(
      'SELECT * FROM rules WHERE id = ?',
      [req.params.id]
    );

    await connection.end();
    
    if (rules.length === 0) {
      return res.status(404).json({ error: 'Правило не найдено' });
    }
    
    res.json(rules[0]);
  } catch (error) {
    console.error('Ошибка получения правила:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новое правило
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, priority, isActive } = req.body;

    if (!title || !content || !category || !priority) {
      return res.status(400).json({ error: 'Необходимо указать все обязательные поля' });
    }

    const connection = await getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO rules (title, content, category, priority, is_active)
      VALUES (?, ?, ?, ?, ?)
    `, [title, content, category, priority, isActive !== false]);

    await connection.end();
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Правило успешно создано' 
    });
  } catch (error) {
    console.error('Ошибка создания правила:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить правило
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, priority, isActive } = req.body;
    const ruleId = req.params.id;

    if (!title || !content || !category || !priority) {
      return res.status(400).json({ error: 'Необходимо указать все обязательные поля' });
    }

    const connection = await getConnection();
    
    await connection.execute(`
      UPDATE rules 
      SET title = ?, content = ?, category = ?, priority = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [title, content, category, priority, isActive !== false, ruleId]);

    await connection.end();
    
    res.json({ message: 'Правило обновлено' });
  } catch (error) {
    console.error('Ошибка обновления правила:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить правило
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ruleId = req.params.id;
    const connection = await getConnection();
    
    await connection.execute('DELETE FROM rules WHERE id = ?', [ruleId]);
    await connection.end();
    
    res.json({ message: 'Правило удалено' });
  } catch (error) {
    console.error('Ошибка удаления правила:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить правила по категории
router.get('/category/:category', async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [rules] = await connection.execute(
      'SELECT * FROM rules WHERE category = ? AND is_active = TRUE ORDER BY priority DESC',
      [req.params.category]
    );

    await connection.end();
    
    res.json(rules);
  } catch (error) {
    console.error('Ошибка получения правил по категории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить активные правила
router.get('/active/list', async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [rules] = await connection.execute(`
      SELECT * FROM rules WHERE is_active = TRUE ORDER BY priority DESC, created_at DESC
    `);

    await connection.end();
    
    res.json(rules);
  } catch (error) {
    console.error('Ошибка получения активных правил:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
