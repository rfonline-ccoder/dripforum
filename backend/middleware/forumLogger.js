const fs = require('fs');
const path = require('path');

// Создаем папку logs если её нет
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const forumLogFile = path.join(logsDir, 'forum.log');

// Функция для записи логов форума
const writeForumLog = (action, userId, username, details = null, ip = null) => {
  const timestamp = new Date().toISOString();
  let logEntry = `[${timestamp}] [${action.toUpperCase()}] User: ${username} (ID: ${userId})`;
  
  if (ip) {
    logEntry += ` | IP: ${ip}`;
  }
  
  if (details) {
    if (typeof details === 'object') {
      logEntry += ` | Details: ${JSON.stringify(details)}`;
    } else {
      logEntry += ` | Details: ${details}`;
    }
  }
  
  logEntry += '\n';
  
  fs.appendFileSync(forumLogFile, logEntry);
};

// Middleware для логирования действий форума
const forumActionLogger = (action) => {
  return (req, res, next) => {
    // Сохраняем оригинальные методы
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Перехватываем ответ
    res.send = function(data) {
      if (req.user && res.statusCode < 400) {
        writeForumLog(
          action, 
          req.user.id, 
          req.user.username, 
          req.body, 
          req.ip
        );
      }
      originalSend.call(this, data);
    };
    
    res.json = function(data) {
      if (req.user && res.statusCode < 400) {
        writeForumLog(
          action, 
          req.user.id, 
          req.user.username, 
          req.body, 
          req.ip
        );
      }
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Функция для логирования действий без middleware
const logForumAction = (action, userId, username, details = null, ip = null) => {
  writeForumLog(action, userId, username, details, ip);
};

// Функция для получения логов форума
const getForumLogs = (limit = 100, offset = 0, filter = null) => {
  try {
    if (!fs.existsSync(forumLogFile)) {
      return [];
    }
    
    const content = fs.readFileSync(forumLogFile, 'utf8');
    let lines = content.split('\n').filter(line => line.trim());
    
    // Применяем фильтр если указан
    if (filter) {
      lines = lines.filter(line => 
        line.toLowerCase().includes(filter.toLowerCase())
      );
    }
    
    // Разворачиваем массив для правильной сортировки (новые сверху)
    lines.reverse();
    
    // Применяем пагинацию
    const paginatedLines = lines.slice(offset, offset + limit);
    
    // Парсим логи в структурированный формат
    const parsedLogs = paginatedLines.map(line => {
      const match = line.match(/\[(.*?)\] \[(.*?)\] User: (.*?) \(ID: (\d+)\)(?: \| IP: (.*?))?(?: \| Details: (.*))?/);
      if (match) {
        return {
          timestamp: match[1],
          action: match[2],
          username: match[3],
          userId: parseInt(match[4]),
          ip: match[5] || null,
          details: match[6] ? JSON.parse(match[6]) : null
        };
      }
      return null;
    }).filter(log => log !== null);
    
    return {
      logs: parsedLogs,
      total: lines.length,
      hasMore: offset + limit < lines.length
    };
  } catch (error) {
    console.error('Ошибка чтения логов форума:', error);
    return { logs: [], total: 0, hasMore: false };
  }
};

// Функция для очистки старых логов
const cleanOldLogs = (daysToKeep = 30) => {
  try {
    if (!fs.existsSync(forumLogFile)) {
      return;
    }
    
    const content = fs.readFileSync(forumLogFile, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const filteredLines = lines.filter(line => {
      const match = line.match(/\[(.*?)\]/);
      if (match) {
        const logDate = new Date(match[1]);
        return logDate > cutoffDate;
      }
      return true;
    });
    
    fs.writeFileSync(forumLogFile, filteredLines.join('\n') + '\n');
    
    console.log(`Очищены логи форума старше ${daysToKeep} дней`);
  } catch (error) {
    console.error('Ошибка очистки логов форума:', error);
  }
};

module.exports = {
  forumActionLogger,
  logForumAction,
  getForumLogs,
  cleanOldLogs,
  writeForumLog
};
