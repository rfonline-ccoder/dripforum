const fs = require('fs');
const path = require('path');

// Создаем папку logs если её нет
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'logs.log');

// Функция для записи логов
const writeLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    if (typeof data === 'object') {
      logEntry += ` | Data: ${JSON.stringify(data)}`;
    } else {
      logEntry += ` | Data: ${data}`;
    }
  }
  
  logEntry += '\n';
  
  fs.appendFileSync(logFile, logEntry);
};

// Middleware для логирования запросов
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Логируем входящий запрос
  writeLog('INFO', `${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // Перехватываем ответ
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Логируем ответ
    writeLog('INFO', `${req.method} ${req.path} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: data ? JSON.stringify(data).length : 0
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// Функции для логирования ошибок
const errorLogger = (error, req, res, next) => {
  writeLog('ERROR', `${req.method} ${req.path} - ${error.message}`, {
    stack: error.stack,
    statusCode: res.statusCode || 500
  });
  next(error);
};

// Функция для логирования действий пользователей
const actionLogger = (action, userId, details = null) => {
  writeLog('ACTION', action, {
    userId,
    timestamp: new Date().toISOString(),
    details
  });
};

module.exports = {
  requestLogger,
  errorLogger,
  actionLogger,
  writeLog
};
