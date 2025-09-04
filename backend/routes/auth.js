const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../database/config');
const { authenticateToken, updateLastActivity } = require('../middleware/auth');
const { logForumAction } = require('../middleware/forumLogger');

const router = express.Router();

// Генерация JWT токена
const config = require('../config.json');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { expiresIn: '24h' }
  );
};

// Регистрация пользователя
router.post('/register', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Имя пользователя должно быть от 3 до 50 символов')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Имя пользователя может содержать только буквы, цифры и подчеркивания'),
  body('email')
    .isEmail()
    .withMessage('Введите корректный email адрес'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен быть не менее 6 символов')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Проверка существования пользователя
    const existingUsers = await query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Пользователь с таким именем или email уже существует' 
      });
    }

    // Хеширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Создание пользователя
    const userId = uuidv4();
    await query(`
      INSERT INTO users (id, username, email, password_hash, role, status, email_verified)
      VALUES (?, ?, ?, ?, 'user', 'active', FALSE)
    `, [userId, username, email, passwordHash]);

    // Генерация токена
    const token = generateToken(userId);

    // Логируем регистрацию
    logForumAction('USER_REGISTER', userId, username, {
      email,
      role: 'user'
    });

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: userId,
        username,
        email,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({ error: 'Ошибка регистрации пользователя' });
  }
});

// Вход пользователя
router.post('/login', [
  body('username').notEmpty().withMessage('Введите имя пользователя или email'),
  body('password').notEmpty().withMessage('Введите пароль')
], async (req, res) => {
  try {
    // Проверка валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Поиск пользователя по username или email
    const users = await query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND status = "active"',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    const user = users[0];

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
    }

    // Обновление времени последней активности
    await query(
      'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Генерация токена
    const token = generateToken(user.id);

    // Логируем вход
    logForumAction('USER_LOGIN', user.id, user.username, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Убираем пароль из ответа
    delete user.password_hash;

    res.json({
      message: 'Вход выполнен успешно',
      token,
      user
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка входа в систему' });
  }
});

// Получение информации о текущем пользователе
router.get('/me', authenticateToken, updateLastActivity, async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password_hash;
    
    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
  }
});

// Обновление токена
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user.id);
    
    res.json({
      message: 'Токен обновлен',
      token: newToken
    });
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    res.status(500).json({ error: 'Ошибка обновления токена' });
  }
});

// Выход пользователя (опционально, можно реализовать blacklist токенов)
router.post('/logout', authenticateToken, (req, res) => {
  // Логируем выход
  logForumAction('USER_LOGOUT', req.user.id, req.user.username, {
    ip: req.ip
  });
  
  // В простой реализации просто возвращаем успех
  // В продакшене можно добавить токен в blacklist
  res.json({ message: 'Выход выполнен успешно' });
});

// Проверка доступности username
router.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const users = await query(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    res.json({ 
      available: users.length === 0,
      username 
    });
  } catch (error) {
    console.error('Ошибка проверки username:', error);
    res.status(500).json({ error: 'Ошибка проверки имени пользователя' });
  }
});

// Проверка доступности email
router.get('/check-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const users = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    res.json({ 
      available: users.length === 0,
      email 
    });
  } catch (error) {
    console.error('Ошибка проверки email:', error);
    res.status(500).json({ error: 'Ошибка проверки email' });
  }
});

module.exports = router;
