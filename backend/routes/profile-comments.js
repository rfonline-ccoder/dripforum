const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../database/config');

// Получить комментарии профиля пользователя
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [comments] = await pool.execute(`
      SELECT 
        pc.id,
        pc.text,
        pc.created_at,
        u.username as author_username,
        u.id as author_id
      FROM profile_comments pc
      JOIN users u ON pc.author_id = u.id
      WHERE pc.user_id = ?
      ORDER BY pc.created_at DESC
    `, [userId]);
    
    res.json(comments);
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Добавить комментарий в профиль
router.post('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;
    const authorId = req.user.id;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Текст комментария не может быть пустым' });
    }
    
    if (text.length > 1000) {
      return res.status(400).json({ error: 'Комментарий слишком длинный (максимум 1000 символов)' });
    }
    
    // Проверяем, что пользователь существует
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Добавляем комментарий
    const [result] = await pool.execute(`
      INSERT INTO profile_comments (user_id, author_id, text, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, authorId, text.trim()]);
    
    // Получаем добавленный комментарий
    const [newComment] = await pool.execute(`
      SELECT 
        pc.id,
        pc.text,
        pc.created_at,
        u.username as author_username,
        u.id as author_id
      FROM profile_comments pc
      JOIN users u ON pc.author_id = u.id
      WHERE pc.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Удалить комментарий
router.delete('/:userId/:commentId', authenticateToken, async (req, res) => {
  try {
    const { userId, commentId } = req.params;
    const currentUserId = req.user.id;
    
    // Получаем комментарий
    const [comments] = await pool.execute(`
      SELECT author_id FROM profile_comments 
      WHERE id = ? AND user_id = ?
    `, [commentId, userId]);
    
    if (comments.length === 0) {
      return res.status(404).json({ error: 'Комментарий не найден' });
    }
    
    const comment = comments[0];
    
    // Проверяем права на удаление (автор комментария или админ)
    if (comment.author_id !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав для удаления комментария' });
    }
    
    // Удаляем комментарий
    await pool.execute('DELETE FROM profile_comments WHERE id = ?', [commentId]);
    
    res.json({ message: 'Комментарий удален' });
  } catch (error) {
    console.error('Ошибка удаления комментария:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
