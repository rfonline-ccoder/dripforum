const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { authenticateToken } = require('../middleware/auth');
const { actionLogger } = require('../middleware/logger');
const { logForumAction } = require('../middleware/forumLogger');

// Получить список всех пользователей
router.get('/', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT 
        u.id, u.username, u.email, u.created_at, u.last_login,
        ug.name as group_name, ug.color as group_color, ug.css_styles,
        u.is_banned, u.ban_reason, u.ban_expires,
        u.is_muted, u.mute_reason, u.mute_expires,
        u.reputation, u.posts_count, u.avatar_url
      FROM users u
      LEFT JOIN user_groups ug ON u.group_id = ug.id
      ORDER BY u.created_at DESC
    `);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить профиль пользователя
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT 
        u.*, ug.name as group_name, ug.color as group_color, ug.css_styles,
        ug.permissions
      FROM users u
      LEFT JOIN user_groups ug ON u.group_id = ug.id
      WHERE u.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    await connection.end();
    
    const userData = rows[0];
    // Убираем IP и связанные аккаунты - таблиц нет
    userData.ip_info = [];
    userData.related_accounts = [];
    
    res.json(userData);
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить профиль пользователя
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { username, email, avatar_url, bio, signature } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем права на редактирование
    const [userRows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?', [req.params.id]
    );
    
    if (userRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Только сам пользователь или админ может редактировать
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      await connection.end();
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    await connection.execute(`
      UPDATE users 
      SET username = ?, email = ?, avatar_url = ?, bio = ?, signature = ?, updated_at = NOW()
      WHERE id = ?
    `, [username, email, avatar_url, bio, signature, req.params.id]);
    
    await connection.end();
    
    actionLogger('UPDATE_USER_PROFILE', req.user.id, {
      targetUserId: req.params.id,
      changes: req.body
    });
    
    // Логируем в форум
    logForumAction('PROFILE_UPDATE', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      changes: req.body
    });
    
    res.json({ message: 'Профиль обновлен', success: true });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сменить пароль пользователя
router.put('/:id/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Проверяем права (только сам пользователь или админ)
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    // Получаем текущий хеш пароля
    const [userRows] = await connection.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.params.id]
    );
    
    if (userRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем текущий пароль (если это не админ)
    if (req.user.role !== 'admin') {
      const bcrypt = require('bcrypt');
      const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password_hash);
      
      if (!isValidPassword) {
        await connection.end();
        return res.status(400).json({ error: 'Неверный текущий пароль' });
      }
    }
    
    // Хешируем новый пароль
    const bcrypt = require('bcrypt');
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.params.id]
    );
    
    await connection.end();
    
    // Логируем действие
    logForumAction('PASSWORD_CHANGE', req.user.id, req.user.username, {
      targetUserId: req.params.id
    });
    
    res.json({ message: 'Пароль успешно изменен', success: true });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сменить группу пользователя
router.put('/:id/change-group', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.body;
    
    // Проверяем права (только админ)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем существование группы
    const [groupRows] = await connection.execute(
      'SELECT id FROM user_groups WHERE id = ?',
      [groupId]
    );
    
    if (groupRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Группа не найдена' });
    }
    
    // Обновляем группу пользователя
    await connection.execute(
      'UPDATE users SET group_id = ? WHERE id = ?',
      [groupId, req.params.id]
    );
    
    await connection.end();
    
    // Логируем действие
    logForumAction('GROUP_CHANGE', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      newGroupId: groupId
    });
    
    res.json({ message: 'Группа пользователя изменена', success: true });
  } catch (error) {
    console.error('Ошибка смены группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выдать достижение пользователю
router.post('/:id/give-achievement', authenticateToken, async (req, res) => {
  try {
    const { achievementId } = req.body;
    
    // Проверяем права (только админ)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем существование достижения
    const [achievementRows] = await connection.execute(
      'SELECT * FROM achievements WHERE id = ?',
      [achievementId]
    );
    
    if (achievementRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Достижение не найдено' });
    }
    
    // Проверяем, есть ли уже это достижение у пользователя
    const [existingRows] = await connection.execute(
      'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      [req.params.id, achievementId]
    );
    
    if (existingRows.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'У пользователя уже есть это достижение' });
    }
    
    // Выдаем достижение
    await connection.execute(`
      INSERT INTO user_achievements (user_id, achievement_id, awarded_at)
      VALUES (?, ?, NOW())
    `, [parseInt(req.params.id), achievementId]);
    
    await connection.end();
    
    // Логируем действие
    logForumAction('ACHIEVEMENT_GIVEN', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      achievementId
    });
    
    res.json({ message: 'Достижение выдано', success: true });
  } catch (error) {
    console.error('Ошибка выдачи достижения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выдать бан пользователю
router.post('/:id/ban', authenticateToken, async (req, res) => {
  try {
    const { reason, duration, duration_type } = req.body; // duration_type: hours, days, months, permanent
    
    // Проверяем права (только модератор или админ)
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    let banExpires = null;
    if (duration_type !== 'permanent') {
      const now = new Date();
      switch (duration_type) {
        case 'hours':
          banExpires = new Date(now.getTime() + duration * 60 * 60 * 1000);
          break;
        case 'days':
          banExpires = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          banExpires = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    await connection.execute(`
      UPDATE users 
      SET is_banned = 1, ban_reason = ?, ban_expires = ?, banned_by = ?, banned_at = NOW()
      WHERE id = ?
    `, [reason, banExpires, req.user.id, req.params.id]);
    
    // Логируем действие
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, duration, duration_type, moderator_id, created_at)
      VALUES (?, 'ban', ?, ?, ?, ?, NOW())
    `, [req.params.id, reason, duration, duration_type, req.user.id]);
    
    await connection.end();
    
    actionLogger('BAN_USER', req.user.id, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    // Логируем в форум
    logForumAction('USER_BANNED', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    res.json({ message: 'Пользователь заблокирован', success: true });
  } catch (error) {
    console.error('Ошибка бана пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Замолчать пользователя
router.post('/:id/mute', authenticateToken, async (req, res) => {
  try {
    const { reason, duration, duration_type } = req.body; // duration_type: hours, days, months
    
    // Проверяем права (только модератор или админ)
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    const now = new Date();
    let muteExpires = null;
    
    switch (duration_type) {
      case 'hours':
        muteExpires = new Date(now.getTime() + duration * 60 * 60 * 1000);
        break;
      case 'days':
        muteExpires = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        break;
      case 'months':
        muteExpires = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        muteExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // По умолчанию 1 день
    }
    
    await connection.execute(`
      UPDATE users 
      SET is_muted = 1, mute_reason = ?, mute_expires = ?, muted_by = ?, muted_at = NOW()
      WHERE id = ?
    `, [reason, muteExpires, req.user.id, req.params.id]);
    
    // Логируем действие
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, duration, duration_type, moderator_id, created_at)
      VALUES (?, 'mute', ?, ?, ?, ?, NOW())
    `, [req.params.id, reason, duration, duration_type, req.user.id]);
    
    await connection.end();
    
    actionLogger('MUTE_USER', req.user.id, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    // Логируем в форум
    logForumAction('USER_MUTED', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    res.json({ message: 'Пользователь замолчан', success: true });
  } catch (error) {
    console.error('Ошибка мута пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Снять бан с пользователя
router.post('/:id/unban', authenticateToken, async (req, res) => {
  try {
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
      UPDATE users 
      SET is_banned = 0, ban_reason = NULL, ban_expires = NULL, banned_by = NULL, banned_at = NULL
      WHERE id = ?
    `, [req.params.id]);
    
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, moderator_id, created_at)
      VALUES (?, 'unban', 'Бан снят', ?, NOW())
    `, [req.params.id, req.user.id]);
    
    await connection.end();
    
    actionLogger('UNBAN_USER', req.user.id, {
      targetUserId: req.params.id
    });
    
    res.json({ message: 'Бан снят', success: true });
  } catch (error) {
    console.error('Ошибка снятия бана:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выдать мут пользователю
router.post('/:id/mute', authenticateToken, async (req, res) => {
  try {
    const { reason, duration, duration_type } = req.body;
    
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    let muteExpires = null;
    if (duration_type !== 'permanent') {
      const now = new Date();
      switch (duration_type) {
        case 'hours':
          muteExpires = new Date(now.getTime() + duration * 60 * 60 * 1000);
          break;
        case 'days':
          muteExpires = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
          break;
        case 'months':
          muteExpires = new Date(now.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    await connection.execute(`
        UPDATE users 
      SET is_muted = 1, mute_reason = ?, mute_expires = ?, muted_by = ?, muted_at = NOW()
        WHERE id = ?
    `, [reason, muteExpires, req.user.id, req.params.id]);
    
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, duration, duration_type, moderator_id, created_at)
      VALUES (?, 'mute', ?, ?, ?, ?, NOW())
    `, [req.params.id, reason, duration, duration_type, req.user.id]);
    
    await connection.end();
    
    actionLogger('USER_MUTED', req.user.id, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    // Логируем в форум
    logForumAction('USER_MUTED', req.user.id, req.user.username, {
      targetUserId: req.params.id,
      reason,
      duration,
      duration_type
    });
    
    res.json({ message: 'Пользователь получил мут', success: true });
  } catch (error) {
    console.error('Ошибка мута пользователя:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Снять мут с пользователя
router.post('/:id/unmute', authenticateToken, async (req, res) => {
  try {
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
        UPDATE users 
      SET is_muted = 0, mute_reason = NULL, mute_expires = NULL, muted_by = NULL, muted_at = NULL
        WHERE id = ?
    `, [req.params.id]);
    
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, moderator_id, created_at)
      VALUES (?, 'unmute', 'Мут снят', ?, NOW())
    `, [req.params.id, req.user.id]);
    
    await connection.end();
    
    actionLogger('UNMUTE_USER', req.user.id, {
      targetUserId: req.params.id
    });
    
    res.json({ message: 'Мут снят', success: true });
  } catch (error) {
    console.error('Ошибка снятия мута:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Изменить группу пользователя
router.post('/:id/change-group', authenticateToken, async (req, res) => {
  try {
    const { group_id } = req.body;
    
    // Только админ может менять группы
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    await connection.execute(`
      UPDATE users SET group_id = ? WHERE id = ?
    `, [group_id, req.params.id]);
    
    await connection.execute(`
      INSERT INTO user_actions (user_id, action_type, reason, moderator_id, created_at)
      VALUES (?, 'change_group', 'Группа изменена', ?, NOW())
    `, [req.params.id, req.user.id]);
    
    await connection.end();
    
    actionLogger('CHANGE_USER_GROUP', req.user.id, {
      targetUserId: req.params.id,
      newGroupId: group_id
    });
    
    res.json({ message: 'Группа пользователя изменена', success: true });
  } catch (error) {
    console.error('Ошибка изменения группы:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получить историю действий с пользователем
router.get('/:id/actions', authenticateToken, async (req, res) => {
  try {
    if (!['moderator', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    const connection = await mysql.createConnection(config.database);
    
    const [rows] = await connection.execute(`
      SELECT 
        ua.*, u.username as moderator_username
      FROM user_actions ua
      LEFT JOIN users u ON ua.moderator_id = u.id
      WHERE ua.user_id = ?
      ORDER BY ua.created_at DESC
    `, [req.params.id]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Ошибка получения истории:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Обновить профиль текущего пользователя
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, bio, signature, avatar_url } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    // Проверяем уникальность username и email
    if (username) {
      const [existingUser] = await connection.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.user.id]
      );
      if (existingUser.length > 0) {
        await connection.end();
        return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
      }
    }
    
    if (email) {
      const [existingEmail] = await connection.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.id]
      );
      if (existingEmail.length > 0) {
        await connection.end();
        return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      }
    }
    
    // Обновляем профиль
    const updateFields = [];
    const updateValues = [];
    
    if (username) {
      updateFields.push('username = ?');
      updateValues.push(username);
    }
    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (signature !== undefined) {
      updateFields.push('signature = ?');
      updateValues.push(signature);
    }
    if (avatar_url !== undefined) {
      updateFields.push('avatar_url = ?');
      updateValues.push(avatar_url);
    }
    
    if (updateFields.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'Нет данных для обновления' });
    }
    
    updateValues.push(req.user.id);
    
    await connection.execute(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    // Логируем действие
    logForumAction(req.user.id, 'PROFILE_UPDATE', {
      updatedFields: updateFields.map(field => field.split(' = ')[0])
    });
    
    await connection.end();

    res.json({
      message: 'Профиль обновлен', 
      success: true,
      updatedFields: updateFields.map(field => field.split(' = ')[0])
    });
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Сменить пароль
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const connection = await mysql.createConnection(config.database);
    
    // Получаем текущий хеш пароля
    const [userRows] = await connection.execute(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Проверяем текущий пароль
    const bcrypt = require('bcrypt');
    const isValidPassword = await bcrypt.compare(currentPassword, userRows[0].password_hash);
    
    if (!isValidPassword) {
      await connection.end();
      return res.status(400).json({ error: 'Неверный текущий пароль' });
    }
    
    // Хешируем новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );
    
    // Логируем действие
    logForumAction(req.user.id, 'PASSWORD_CHANGE', {});
    
    await connection.end();
    
    res.json({ 
      message: 'Пароль успешно изменен', 
      success: true 
    });
  } catch (error) {
    console.error('Ошибка смены пароля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
