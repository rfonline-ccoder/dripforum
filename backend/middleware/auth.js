const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const config = require('../config.json');

// Подключение к базе данных
const getConnection = async () => {
  return await mysql.createConnection(config.database);
};

// Проверка JWT токена
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Токен доступа не предоставлен' });
    }
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Получаем информацию о пользователе из БД
    const connection = await getConnection();
    const [users] = await connection.execute('SELECT * FROM users WHERE id = ? AND status = "active"', [decoded.userId]);
    await connection.end();
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден или заблокирован' });
    }
    
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Недействительный токен' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Токен истек' });
    }
    
    console.error('Ошибка аутентификации:', error);
    return res.status(500).json({ error: 'Ошибка аутентификации' });
  }
};

// Проверка роли пользователя
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' });
    }
    
    next();
  };
};

// Проверка владения ресурсом или роли
const requireOwnershipOrRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Требуется аутентификация' });
    }
    
    // Если пользователь владеет ресурсом, разрешаем
    if (req.params.userId === req.user.id) {
      return next();
    }
    
    // Если у пользователя нужная роль, разрешаем
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    return res.status(403).json({ error: 'Недостаточно прав' });
  };
};

// Проверка активности пользователя
const requireActiveUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Требуется аутентификация' });
  }
  
  if (req.user.status !== 'active') {
    return res.status(403).json({ error: 'Аккаунт заблокирован или приостановлен' });
  }
  
  next();
};

// Обновление времени последней активности
const updateLastActivity = async (req, res, next) => {
  if (req.user) {
    try {
      const connection = await getConnection();
      await connection.execute(
        'UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
        [req.user.id]
      );
      await connection.end();
    } catch (error) {
      console.error('Ошибка обновления активности:', error);
    }
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnershipOrRole,
  requireActiveUser,
  updateLastActivity
};
