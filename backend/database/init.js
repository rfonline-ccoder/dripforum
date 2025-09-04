const { query, testConnection } = require('./config');

// SQL скрипты для создания таблиц
const createTablesSQL = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('user', 'vip', 'moderator', 'admin') DEFAULT 'user',
      status ENUM('active', 'banned', 'suspended') DEFAULT 'active',
      avatar_url VARCHAR(500),
      bio TEXT,
      signature TEXT,
      location VARCHAR(100),
      join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      posts_count INT DEFAULT 0,
      topics_count INT DEFAULT 0,
      reputation INT DEFAULT 0,
      email_verified BOOLEAN DEFAULT FALSE,
      ban_reason TEXT,
      ban_expires_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      parent_id VARCHAR(36),
      position INT DEFAULT 0,
      is_visible BOOLEAN DEFAULT TRUE,
      posts_count INT DEFAULT 0,
      topics_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_parent_id (parent_id),
      INDEX idx_position (position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  topics: `
    CREATE TABLE IF NOT EXISTS topics (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category_id VARCHAR(36) NOT NULL,
      author_id VARCHAR(36) NOT NULL,
      is_pinned BOOLEAN DEFAULT FALSE,
      is_locked BOOLEAN DEFAULT FALSE,
      views_count INT DEFAULT 0,
      replies_count INT DEFAULT 0,
      last_post_id VARCHAR(36),
      last_post_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category_id (category_id),
      INDEX idx_author_id (author_id),
      INDEX idx_last_post_at (last_post_at),
      INDEX idx_is_pinned (is_pinned)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  posts: `
    CREATE TABLE IF NOT EXISTS posts (
      id VARCHAR(36) PRIMARY KEY,
      topic_id VARCHAR(36) NOT NULL,
      author_id VARCHAR(36) NOT NULL,
      content TEXT NOT NULL,
      is_edited BOOLEAN DEFAULT FALSE,
      edited_at TIMESTAMP NULL,
      edited_by VARCHAR(36),
      likes_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_topic_id (topic_id),
      INDEX idx_author_id (author_id),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  tags: `
    CREATE TABLE IF NOT EXISTS tags (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      color VARCHAR(7) DEFAULT '#8b5cf6',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  topic_tags: `
    CREATE TABLE IF NOT EXISTS topic_tags (
      topic_id VARCHAR(36),
      tag_id VARCHAR(36),
      PRIMARY KEY (topic_id, tag_id),
      INDEX idx_topic_id (topic_id),
      INDEX idx_tag_id (tag_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  reports: `
    CREATE TABLE IF NOT EXISTS reports (
      id VARCHAR(36) PRIMARY KEY,
      reporter_id VARCHAR(36) NOT NULL,
      reported_user_id VARCHAR(36),
      reported_post_id VARCHAR(36),
      reported_topic_id VARCHAR(36),
      reason ENUM('spam', 'harassment', 'inappropriate', 'cheating', 'other') NOT NULL,
      description TEXT NOT NULL,
      status ENUM('pending', 'resolved', 'rejected') DEFAULT 'pending',
      priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
      assigned_to VARCHAR(36),
      resolved_by VARCHAR(36),
      resolved_at TIMESTAMP NULL,
      resolution_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_assigned_to (assigned_to),
      INDEX idx_reporter_id (reporter_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  post_likes: `
    CREATE TABLE IF NOT EXISTS post_likes (
      id VARCHAR(36) PRIMARY KEY,
      post_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_like (post_id, user_id),
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  bans: `
    CREATE TABLE IF NOT EXISTS bans (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      banned_by VARCHAR(36) NOT NULL,
      reason TEXT NOT NULL,
      ban_type ENUM('temporary', 'permanent') NOT NULL,
      expires_at TIMESTAMP NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  forum_settings: `
    CREATE TABLE IF NOT EXISTS forum_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
      description TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `,
  
  group_permissions: `
    CREATE TABLE IF NOT EXISTS group_permissions (
      id VARCHAR(36) PRIMARY KEY,
      role ENUM('user', 'vip', 'moderator', 'admin') NOT NULL,
      permission VARCHAR(100) NOT NULL,
      granted BOOLEAN DEFAULT TRUE,
      UNIQUE KEY unique_role_permission (role, permission)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `
};

// Проверка существования таблицы
async function tableExists(tableName) {
  try {
    const result = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `, [process.env.MYSQL_DATABASE || 'dripforum', tableName]);
    
    return result[0].count > 0;
  } catch (error) {
    console.error(`Ошибка проверки таблицы ${tableName}:`, error);
    return false;
  }
}

// Создание таблицы если не существует
async function createTableIfNotExists(tableName, createSQL) {
  try {
    const exists = await tableExists(tableName);
    if (!exists) {
      console.log(`📋 Создание таблицы: ${tableName}`);
      await query(createSQL);
      console.log(`✅ Таблица ${tableName} создана успешно`);
    } else {
      console.log(`✅ Таблица ${tableName} уже существует`);
    }
  } catch (error) {
    console.error(`❌ Ошибка создания таблицы ${tableName}:`, error);
    throw error;
  }
}

// Вставка начальных данных
async function insertInitialData() {
  try {
    // Проверяем есть ли уже данные
    const categoriesCount = await query('SELECT COUNT(*) as count FROM categories');
    if (categoriesCount[0].count === 0) {
      console.log('📝 Вставка начальных данных...');
      
      // Создание корневой категории
      await query(`
        INSERT INTO categories (id, name, description, icon, position) 
        VALUES (UUID(), 'Общие обсуждения', 'Общие темы и обсуждения', 'chat', 1)
      `);
      
      // Создание админа по умолчанию
      const bcrypt = require('bcryptjs');
      const adminPassword = await bcrypt.hash('admin123', 10);
      
      await query(`
        INSERT INTO users (id, username, email, password_hash, role, email_verified) 
        VALUES (UUID(), 'admin', 'admin@dripforum.com', ?, 'admin', TRUE)
      `, [adminPassword]);
      
      // Настройки форума
      await query(`
        INSERT INTO forum_settings (setting_key, setting_value, setting_type, description) VALUES 
        ('forum_name', 'Arizona DRIP Forum', 'string', 'Название форума'),
        ('forum_description', 'Форум для обсуждения Arizona DRIP', 'string', 'Описание форума'),
        ('posts_per_page', '20', 'integer', 'Количество постов на странице'),
        ('topics_per_page', '25', 'integer', 'Количество тем на странице'),
        ('allow_registration', 'true', 'boolean', 'Разрешить регистрацию новых пользователей'),
        ('require_email_verification', 'false', 'boolean', 'Требовать подтверждение email')
      `);
      
      console.log('✅ Начальные данные добавлены');
    } else {
      console.log('✅ Начальные данные уже существуют');
    }
  } catch (error) {
    console.error('❌ Ошибка вставки начальных данных:', error);
    // Не прерываем работу сервера из-за ошибки вставки данных
  }
}

// Основная функция инициализации
async function initializeDatabase() {
  try {
    // Тестируем подключение
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Не удалось подключиться к базе данных');
    }
    
    console.log('🔍 Проверка структуры базы данных...');
    
    // Создаем все таблицы
    for (const [tableName, createSQL] of Object.entries(createTablesSQL)) {
      await createTableIfNotExists(tableName, createSQL);
    }
    
    // Вставляем начальные данные
    await insertInitialData();
    
    console.log('🎉 База данных полностью инициализирована!');
    
  } catch (error) {
    console.error('❌ Критическая ошибка инициализации БД:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  tableExists,
  createTableIfNotExists
};
