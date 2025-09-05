const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config');
const { authenticateToken } = require('../middleware/auth');
const { checkCategoryPermission, checkInheritedPermissions } = require('../middleware/categoryPermissions');
const { v4: uuidv4 } = require('uuid');

// Получение всех категорий с фильтрацией по правам доступа
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    const user = req.user;
    
    const [categories] = await connection.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as topics_count,
        COUNT(DISTINCT p.id) as posts_count
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id
      LEFT JOIN posts p ON t.id = p.topic_id
      GROUP BY c.id
      ORDER BY c.position ASC, c.created_at ASC
    `);
    
    // Фильтруем категории по правам доступа
    const visibleCategories = [];
    
    for (const category of categories) {
      const viewPermissions = JSON.parse(category.view_permissions || '["all"]');
      const moderatePermissions = JSON.parse(category.moderate_permissions || '["admin", "moderator"]');
      
      let canView = false;
      
      // Проверяем права на просмотр
      if (viewPermissions.includes('all')) {
        canView = true;
      } else if (viewPermissions.includes(user.role)) {
        canView = true;
      } else if (user.role === 'admin') {
        canView = true;
      }
      
      // Проверяем скрытые категории
      if (category.is_hidden && !canView) {
        continue;
      }
      
      // Проверяем заблокированные категории
      if (category.is_locked && !moderatePermissions.includes(user.role) && user.role !== 'admin') {
        continue;
      }
      
      // Проверяем наследование прав от родительской категории
      if (category.parent_id) {
        const hasInheritedAccess = await checkInheritedPermissions(category.parent_id, user, 'view');
        if (!hasInheritedAccess) {
          continue;
        }
      }
      
      visibleCategories.push(category);
    }
    
    await connection.end();
    res.json(visibleCategories);
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({ error: 'Ошибка получения категорий' });
  }
});

// Создание новой категории (только для админов)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Проверяем права админа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { 
      name, 
      description, 
      icon, 
      parent_id, 
      position,
      view_permissions = '["all"]',
      create_topic_permissions = '["admin"]',
      create_subcategory_permissions = '["admin"]',
      post_permissions = '["all"]',
      moderate_permissions = '["admin", "moderator"]',
      is_locked = false,
      is_hidden = false
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const connection = await mysql.createConnection(config.database);
    
    const categoryId = uuidv4();
    
    await connection.execute(`
      INSERT INTO categories (
        id, name, description, icon, parent_id, position, is_visible,
        view_permissions, create_topic_permissions, create_subcategory_permissions,
        post_permissions, moderate_permissions, is_locked, is_hidden
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
    `, [
      categoryId, name.trim(), description || null, icon || null, parent_id || null, position || 0,
      JSON.stringify(view_permissions), JSON.stringify(create_topic_permissions), 
      JSON.stringify(create_subcategory_permissions), JSON.stringify(post_permissions),
      JSON.stringify(moderate_permissions), is_locked, is_hidden
    ]);
    
    // Получаем созданную категорию
    const [newCategory] = await connection.execute(`
      SELECT * FROM categories WHERE id = ?
    `, [categoryId]);
    
    await connection.end();
    
    res.status(201).json({
      ...newCategory[0],
      topics_count: 0,
      posts_count: 0
    });
  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({ error: 'Ошибка создания категории' });
  }
});

// Получение категории по ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [categories] = await connection.execute(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as topics_count,
        COUNT(DISTINCT p.id) as posts_count
      FROM categories c
      LEFT JOIN topics t ON c.id = t.category_id
      LEFT JOIN posts p ON t.id = p.topic_id
      WHERE c.id = ? AND c.is_visible = 1
      GROUP BY c.id
    `, [req.params.id]);
    
    await connection.end();
    
    if (categories.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(categories[0]);
  } catch (error) {
    console.error('Ошибка получения категории:', error);
    res.status(500).json({ error: 'Ошибка получения категории' });
  }
});

// Обновление категории (только для админов)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    // Проверяем права админа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const { name, description, icon, parent_id, position, is_visible } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Название категории обязательно' });
    }

    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
      UPDATE categories 
      SET name = ?, description = ?, icon = ?, parent_id = ?, position = ?, is_visible = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name.trim(), description || null, icon || null, parent_id || null, position || 0, is_visible !== false, req.params.id]);
    
    // Получаем обновленную категорию
    const [updatedCategory] = await connection.execute(`
      SELECT * FROM categories WHERE id = ?
    `, [req.params.id]);
    
    await connection.end();
    
    if (updatedCategory.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error('Ошибка обновления категории:', error);
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

// Удаление категории (только для админов)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Проверяем права админа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли темы в этой категории
    const [topics] = await connection.execute(`
      SELECT COUNT(*) as count FROM topics WHERE category_id = ?
    `, [req.params.id]);
    
    if (topics[0].count > 0) {
      await connection.end();
      return res.status(400).json({ error: 'Нельзя удалить категорию с темами' });
    }
    
    // Удаляем категорию
    await connection.execute(`
      DELETE FROM categories WHERE id = ?
    `, [req.params.id]);
    
    await connection.end();
    
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

// Обновление прав доступа к категории (только для админов)
router.put('/:id/permissions', authenticateToken, async (req, res) => {
  try {
    // Проверяем права админа
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }

    const {
      view_permissions,
      create_topic_permissions,
      create_subcategory_permissions,
      post_permissions,
      moderate_permissions,
      is_locked,
      is_hidden
    } = req.body;

    const connection = await mysql.createConnection(config.database);
    
    // Проверяем существование категории
    const [categories] = await connection.execute(
      'SELECT id FROM categories WHERE id = ?',
      [req.params.id]
    );
    
    if (categories.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Категория не найдена' });
    }
    
    // Обновляем права доступа
    await connection.execute(`
      UPDATE categories SET 
        view_permissions = ?,
        create_topic_permissions = ?,
        create_subcategory_permissions = ?,
        post_permissions = ?,
        moderate_permissions = ?,
        is_locked = ?,
        is_hidden = ?
      WHERE id = ?
    `, [
      JSON.stringify(view_permissions),
      JSON.stringify(create_topic_permissions),
      JSON.stringify(create_subcategory_permissions),
      JSON.stringify(post_permissions),
      JSON.stringify(moderate_permissions),
      is_locked,
      is_hidden,
      req.params.id
    ]);
    
    await connection.end();
    
    res.json({ message: 'Права доступа обновлены' });
  } catch (error) {
    console.error('Ошибка обновления прав доступа:', error);
    res.status(500).json({ error: 'Ошибка обновления прав доступа' });
  }
});

module.exports = router;