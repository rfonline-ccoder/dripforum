const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/config');
const { 
  authenticateToken, 
  requireRole, 
  requireActiveUser, 
  updateLastActivity 
} = require('../middleware/auth');

const router = express.Router();

// Получение списка тем (с пагинацией и фильтрацией)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id;
    const search = req.query.search || '';
    const sort = req.query.sort || 'latest'; // latest, popular, oldest

    let whereClause = 'WHERE 1=1';
    let params = [];

    if (categoryId) {
      whereClause += ' AND t.category_id = ?';
      params.push(categoryId);
    }

    if (search) {
      whereClause += ' AND (t.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    let orderClause = '';
    switch (sort) {
      case 'popular':
        orderClause = 'ORDER BY t.views_count DESC, t.replies_count DESC';
        break;
      case 'oldest':
        orderClause = 'ORDER BY t.created_at ASC';
        break;
      default: // latest
        orderClause = 'ORDER BY t.is_pinned DESC, t.last_post_at DESC, t.created_at DESC';
    }

    // Общее количество тем
    const countResult = await query(`
      SELECT COUNT(DISTINCT t.id) as total
      FROM topics t
      LEFT JOIN posts p ON t.id = p.topic_id
      ${whereClause}
    `, params);
    const total = countResult[0].total;

    // Список тем
    const topics = await query(`
      SELECT DISTINCT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             c.name as category_name,
             c.icon as category_icon,
             COUNT(p.id) as replies_count,
             MAX(p.created_at) as last_post_at,
             p2.content as last_post_content,
             u2.username as last_post_author
      FROM topics t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      LEFT JOIN posts p ON t.id = p.topic_id
      LEFT JOIN posts p2 ON t.last_post_id = p2.id
      LEFT JOIN users u2 ON p2.author_id = u2.id
      ${whereClause}
      GROUP BY t.id
      ${orderClause}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      topics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения тем:', error);
    res.status(500).json({ error: 'Ошибка получения списка тем' });
  }
});

// Получение одной темы с постами
router.get('/:topicId', async (req, res) => {
  try {
    const { topicId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Получаем информацию о теме
    const topics = await query(`
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             c.name as category_name,
             c.icon as category_icon
      FROM topics t
      JOIN users u ON t.author_id = u.id
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [topicId]);

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    const topic = topics[0];

    // Увеличиваем счетчик просмотров
    await query(
      'UPDATE topics SET views_count = views_count + 1 WHERE id = ?',
      [topicId]
    );

    // Получаем посты в теме
    const posts = await query(`
      SELECT p.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             u.role as author_role,
             u.join_date as author_join_date,
             u.posts_count as author_posts_count,
             u.reputation as author_reputation
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.topic_id = ?
      ORDER BY p.created_at ASC
      LIMIT ? OFFSET ?
    `, [topicId, limit, offset]);

    // Общее количество постов
    const postsCountResult = await query(
      'SELECT COUNT(*) as total FROM posts WHERE topic_id = ?',
      [topicId]
    );
    const totalPosts = postsCountResult[0].total;

    res.json({
      topic,
      posts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        pages: Math.ceil(totalPosts / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения темы:', error);
    res.status(500).json({ error: 'Ошибка получения темы' });
  }
});

// Создание новой темы
router.post('/', [
  authenticateToken,
  requireActiveUser,
  updateLastActivity,
  body('title').isLength({ min: 1, max: 255 }).withMessage('Название темы обязательно'),
  body('content').isLength({ min: 1 }).withMessage('Содержание темы обязательно'),
  body('category_id').isUUID().withMessage('Неверный ID категории')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category_id } = req.body;
    const authorId = req.user.id;

    // Проверяем существование категории
    const categoryExists = await query(
      'SELECT id FROM categories WHERE id = ? AND is_visible = TRUE',
      [category_id]
    );
    if (categoryExists.length === 0) {
      return res.status(400).json({ error: 'Категория не найдена' });
    }

    // Создаем тему
    const topicId = uuidv4();
    await query(`
      INSERT INTO topics (id, title, category_id, author_id)
      VALUES (?, ?, ?, ?)
    `, [topicId, title, category_id, authorId]);

    // Создаем первый пост
    const postId = uuidv4();
    await query(`
      INSERT INTO posts (id, topic_id, author_id, content)
      VALUES (?, ?, ?, ?)
    `, [postId, topicId, authorId, content]);

    // Обновляем тему с последним постом
    await query(`
      UPDATE topics 
      SET last_post_id = ?, last_post_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [postId, topicId]);

    // Обновляем счетчики
    await query(`
      UPDATE users 
      SET topics_count = topics_count + 1, posts_count = posts_count + 1
      WHERE id = ?
    `, [authorId]);

    await query(`
      UPDATE categories 
      SET topics_count = topics_count + 1, posts_count = posts_count + 1
      WHERE id = ?
    `, [category_id]);

    res.status(201).json({
      message: 'Тема создана успешно',
      topic: {
        id: topicId,
        title,
        category_id,
        author_id: authorId
      },
      post: {
        id: postId,
        content
      }
    });

  } catch (error) {
    console.error('Ошибка создания темы:', error);
    res.status(500).json({ error: 'Ошибка создания темы' });
  }
});

// Обновление темы
router.put('/:topicId', [
  authenticateToken,
  requireActiveUser,
  updateLastActivity,
  body('title').optional().isLength({ min: 1, max: 255 }).withMessage('Название темы обязательно'),
  body('content').optional().isLength({ min: 1 }).withMessage('Содержание темы обязательно')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;

    // Проверяем существование темы и права на редактирование
    const topics = await query(`
      SELECT t.*, p.id as first_post_id
      FROM topics t
      JOIN posts p ON t.id = p.topic_id AND p.author_id = t.author_id
      WHERE t.id = ? AND t.author_id = ?
      ORDER BY p.created_at ASC
      LIMIT 1
    `, [topicId, userId]);

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Тема не найдена или нет прав на редактирование' });
    }

    const topic = topics[0];

    // Обновляем тему если указано название
    if (title) {
      await query(
        'UPDATE topics SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, topicId]
      );
    }

    // Обновляем первый пост если указано содержание
    if (content) {
      await query(`
        UPDATE posts 
        SET content = ?, is_edited = TRUE, edited_at = CURRENT_TIMESTAMP, edited_by = ?
        WHERE id = ?
      `, [content, userId, topic.first_post_id]);
    }

    res.json({ message: 'Тема обновлена успешно' });

  } catch (error) {
    console.error('Ошибка обновления темы:', error);
    res.status(500).json({ error: 'Ошибка обновления темы' });
  }
});

// Закрепление/открепление темы (только для модераторов)
router.patch('/:topicId/pin', [
  authenticateToken,
  requireRole(['moderator', 'admin']),
  updateLastActivity,
  body('is_pinned').isBoolean().withMessage('is_pinned должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const { is_pinned } = req.body;

    // Проверяем существование темы
    const topicExists = await query(
      'SELECT id FROM topics WHERE id = ?',
      [topicId]
    );
    if (topicExists.length === 0) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    await query(
      'UPDATE topics SET is_pinned = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_pinned, topicId]
    );

    res.json({ message: `Тема ${is_pinned ? 'закреплена' : 'откреплена'} успешно` });

  } catch (error) {
    console.error('Ошибка закрепления темы:', error);
    res.status(500).json({ error: 'Ошибка закрепления темы' });
  }
});

// Блокировка/разблокировка темы (только для модераторов)
router.patch('/:topicId/lock', [
  authenticateToken,
  requireRole(['moderator', 'admin']),
  updateLastActivity,
  body('is_locked').isBoolean().withMessage('is_locked должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { topicId } = req.params;
    const { is_locked } = req.body;

    // Проверяем существование темы
    const topicExists = await query(
      'SELECT id FROM topics WHERE id = ?',
      [topicId]
    );
    if (topicExists.length === 0) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    await query(
      'UPDATE topics SET is_locked = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_locked, topicId]
    );

    res.json({ message: `Тема ${is_locked ? 'заблокирована' : 'разблокирована'} успешно` });

  } catch (error) {
    console.error('Ошибка блокировки темы:', error);
    res.status(500).json({ error: 'Ошибка блокировки темы' });
  }
});

// Удаление темы (только для автора или модераторов)
router.delete('/:topicId', [
  authenticateToken,
  requireActiveUser,
  updateLastActivity
], async (req, res) => {
  try {
    const { topicId } = req.params;
    const userId = req.user.id;

    // Проверяем существование темы и права на удаление
    const topics = await query(`
      SELECT t.*, c.id as category_id
      FROM topics t
      JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [topicId]);

    if (topics.length === 0) {
      return res.status(404).json({ error: 'Тема не найдена' });
    }

    const topic = topics[0];

    // Проверяем права (автор или модератор/админ)
    if (topic.author_id !== userId && !['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав для удаления темы' });
    }

    // Получаем количество постов для обновления счетчиков
    const postsCountResult = await query(
      'SELECT COUNT(*) as count FROM posts WHERE topic_id = ?',
      [topicId]
    );
    const postsCount = postsCountResult[0].count;

    // Удаляем тему (посты удалятся каскадно)
    await query('DELETE FROM topics WHERE id = ?', [topicId]);

    // Обновляем счетчики
    await query(`
      UPDATE users 
      SET topics_count = GREATEST(topics_count - 1, 0), 
          posts_count = GREATEST(posts_count - ?, 0)
      WHERE id = ?
    `, [postsCount, topic.author_id]);

    await query(`
      UPDATE categories 
      SET topics_count = GREATEST(topics_count - 1, 0), 
          posts_count = GREATEST(posts_count - ?, 0)
      WHERE id = ?
    `, [postsCount, topic.category_id]);

    res.json({ message: 'Тема удалена успешно' });

  } catch (error) {
    console.error('Ошибка удаления темы:', error);
    res.status(500).json({ error: 'Ошибка удаления темы' });
  }
});

module.exports = router;
