const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/config');
const { 
  authenticateToken, 
  requireRole, 
  updateLastActivity 
} = require('../middleware/auth');

const router = express.Router();

// Получение всех категорий
router.get('/', async (req, res) => {
  try {
    const categories = await query(`
      SELECT c.*, 
             COUNT(DISTINCT t.id) as topics_count,
             COUNT(DISTINCT p.id) as posts_count,
             MAX(p.created_at) as last_activity
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id
      LEFT JOIN posts p ON t.id = p.topic_id
      WHERE c.is_visible = TRUE
      GROUP BY c.id
      ORDER BY c.position ASC, c.name ASC
    `);

    // Группируем категории по родительским
    const categoriesMap = {};
    const rootCategories = [];

    categories.forEach(category => {
      categoriesMap[category.id] = {
        ...category,
        children: []
      };
    });

    categories.forEach(category => {
      if (category.parent_id && categoriesMap[category.parent_id]) {
        categoriesMap[category.parent_id].children.push(categoriesMap[category.id]);
      } else {
        rootCategories.push(categoriesMap[category.id]);
      }
    });

    res.json({ categories: rootCategories });

  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения списка категорий' });
  }
});

// Получение одной категории с темами
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    // Получаем информацию о категории
    const categories = await query(`
      SELECT c.*, 
             COUNT(DISTINCT t.id) as total_topics,
             COUNT(DISTINCT p.id) as total_posts
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id
      LEFT JOIN posts p ON t.id = p.topic_id
      WHERE c.id = ? AND c.is_visible = TRUE
      GROUP BY c.id
    `, [categoryId]);

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    const category = categories[0];

    // Получаем темы в категории
    const topics = await query(`
      SELECT t.*, 
             u.username as author_username,
             u.avatar_url as author_avatar,
             COUNT(p.id) as replies_count,
             MAX(p.created_at) as last_post_at,
             p2.content as last_post_content,
             u2.username as last_post_author
      FROM topics t
      JOIN users u ON t.author_id = u.id
      LEFT JOIN posts p ON t.id = p.topic_id
      LEFT JOIN posts p2 ON t.last_post_id = p2.id
      LEFT JOIN users u2 ON p2.author_id = u2.id
      WHERE t.category_id = ?
      GROUP BY t.id
      ORDER BY t.is_pinned DESC, t.last_post_at DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]);

    res.json({
      category,
      topics,
      pagination: {
        page,
        limit,
        total: category.total_topics,
        pages: Math.ceil(category.total_topics / limit)
      }
    });

  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// Создание новой категории (только для админов)
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  updateLastActivity,
  body('name').isLength({ min: 1, max: 100 }).withMessage('Название категории обязательно'),
  body('description').optional().isLength({ max: 500 }).withMessage('Описание слишком длинное'),
  body('parent_id').optional().isUUID().withMessage('Неверный ID родительской категории'),
  body('position').optional().isInt({ min: 0 }).withMessage('Позиция должна быть положительным числом')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, parent_id, position, icon } = req.body;

    // Проверяем существование родительской категории
    if (parent_id) {
      const parentExists = await query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      );
      if (parentExists.length === 0) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
    }

    const categoryId = uuidv4();
    await query(`
      INSERT INTO categories (id, name, description, icon, parent_id, position)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [categoryId, name, description || null, icon || null, parent_id || null, position || 0]);

    res.status(201).json({
      message: 'Категория создана успешно',
      category: {
        id: categoryId,
        name,
        description,
        icon,
        parent_id,
        position
      }
    });

  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// Обновление категории (только для админов)
router.put('/:categoryId', [
  authenticateToken,
  requireRole(['admin']),
  updateLastActivity,
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Название категории обязательно'),
  body('description').optional().isLength({ max: 500 }).withMessage('Описание слишком длинное'),
  body('parent_id').optional().isUUID().withMessage('Неверный ID родительской категории'),
  body('position').optional().isInt({ min: 0 }).withMessage('Позиция должна быть положительным числом'),
  body('is_visible').optional().isBoolean().withMessage('is_visible должен быть boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { categoryId } = req.params;
    const { name, description, parent_id, position, icon, is_visible } = req.body;

    // Проверяем существование категории
    const categoryExists = await query(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );
    if (categoryExists.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Проверяем что категория не пытается стать родителем самой себя
    if (parent_id === categoryId) {
      return res.status(400).json({ error: 'Категория не может быть родителем самой себя' });
    }

    // Проверяем существование родительской категории
    if (parent_id) {
      const parentExists = await query(
        'SELECT id FROM categories WHERE id = ?',
        [parent_id]
      );
      if (parentExists.length === 0) {
        return res.status(400).json({ error: 'Родительская категория не найдена' });
      }
    }

    // Обновляем категорию
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(icon);
    }
    if (parent_id !== undefined) {
      updateFields.push('parent_id = ?');
      updateValues.push(parent_id);
    }
    if (position !== undefined) {
      updateFields.push('position = ?');
      updateValues.push(position);
    }
    if (is_visible !== undefined) {
      updateFields.push('is_visible = ?');
      updateValues.push(is_visible);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Не указаны поля для обновления' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(categoryId);

    await query(`
      UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    res.json({ message: 'Категория обновлена успешно' });

  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// Удаление категории (только для админов)
router.delete('/:categoryId', [
  authenticateToken,
  requireRole(['admin']),
  updateLastActivity
], async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Проверяем существование категории
    const categoryExists = await query(
      'SELECT id FROM categories WHERE id = ?',
      [categoryId]
    );
    if (categoryExists.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    // Проверяем есть ли темы в категории
    const topicsCount = await query(
      'SELECT COUNT(*) as count FROM topics WHERE category_id = ?',
      [categoryId]
    );

    if (topicsCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить категорию, содержащую темы' 
      });
    }

    // Проверяем есть ли дочерние категории
    const childrenCount = await query(
      'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
      [categoryId]
    );

    if (childrenCount[0].count > 0) {
      return res.status(400).json({ 
        error: 'Нельзя удалить категорию, содержащую подкатегории' 
      });
    }

    // Удаляем категорию
    await query('DELETE FROM categories WHERE id = ?', [categoryId]);

    res.json({ message: 'Категория удалена успешно' });

  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

module.exports = router;
