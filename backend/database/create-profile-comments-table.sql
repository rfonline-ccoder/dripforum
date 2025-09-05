-- Создание таблицы для комментариев в профиле пользователей
CREATE TABLE IF NOT EXISTS profile_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  author_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Индексы для быстрого поиска
  INDEX idx_user_id (user_id),
  INDEX idx_author_id (author_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
