const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');
const { logForumAction } = require('../middleware/forumLogger');

// Подключение к базе данных
const getConnection = async () => {
  return await mysql.createConnection(config.database);
};

// Получить все посты
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [posts] = await connection.execute(`
      SELECT 
        p.id,
        p.content,
        p.category,
        p.status,
        p.complaints_count,
        p.created_at,
        p.updated_at,
             u.username as author_username,
        u.id as author_id
      FROM posts p
      JOIN users u ON p.author_id = u.id
      ORDER BY p.created_at DESC
    `);

    await connection.end();
    
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения постов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить пост по ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [posts] = await connection.execute(`
      SELECT 
        p.*,
        u.username as author_username
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `, [req.params.id]);

    await connection.end();

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Пост не найден' });
    }

    res.json(posts[0]);
  } catch (error) {
    console.error('Ошибка получения поста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Создать новый пост
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, category } = req.body;
    const author_id = req.user.id;

    if (!content || !category) {
      return res.status(400).json({ error: 'Необходимо указать содержание и категорию' });
    }

    const connection = await getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO posts (author_id, content, category, status)
      VALUES (?, ?, ?, 'pending')
    `, [author_id, content, category]);

    await connection.end();
    
    // Логируем создание поста
    logForumAction('POST_CREATE', req.user.id, req.user.username, {
      postId: result.insertId,
      content: content.substring(0, 100) + '...',
      category
    });
    
    res.status(201).json({ 
      id: result.insertId,
      message: 'Пост успешно создан' 
    });
  } catch (error) {
    console.error('Ошибка создания поста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить статус поста
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const postId = req.params.id;

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const connection = await getConnection();
    
    await connection.execute(`
      UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [status, postId]);

    await connection.end();
    
    // Логируем обновление статуса поста
    logForumAction('POST_STATUS_UPDATE', req.user.id, req.user.username, {
      postId: postId,
      newStatus: status
    });
    
    res.json({ message: 'Статус поста обновлен' });
  } catch (error) {
    console.error('Ошибка обновления статуса:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить пост
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const connection = await getConnection();
    
    await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
    await connection.end();
    
    // Логируем удаление поста
    logForumAction('POST_DELETE', req.user.id, req.user.username, {
      postId: postId
    });
    
    res.json({ message: 'Пост удален' });
  } catch (error) {
    console.error('Ошибка удаления поста:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить посты по категории
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [posts] = await connection.execute(`
      SELECT 
        p.id,
        p.content,
        p.category,
        p.status,
        p.complaints_count,
        p.created_at,
        p.updated_at,
             u.username as author_username,
        u.id as author_id
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.category = ?
      ORDER BY p.created_at DESC
    `, [req.params.category]);

    await connection.end();
    
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения постов по категории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить посты пользователя
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const connection = await getConnection();
    
    const [posts] = await connection.execute(`
      SELECT 
        p.id,
        p.content,
        p.category,
        p.status,
        p.complaints_count,
        p.created_at,
        p.updated_at,
        u.username as author_username,
        u.id as author_id
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.author_id = ?
      ORDER BY p.created_at DESC
    `, [req.params.userId]);

    await connection.end();
    
    res.json(posts);
  } catch (error) {
    console.error('Ошибка получения постов пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
