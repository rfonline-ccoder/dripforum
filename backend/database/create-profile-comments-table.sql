-- Создание таблицы для комментариев в профиле пользователей
CREATE TABLE IF NOT EXISTS profile_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  author_id INT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Индексы для быстрого поиска
  INDEX idx_user_id (user_id),
  INDEX idx_author_id (author_id),
  INDEX idx_created_at (created_at),
  
  -- Внешние ключи
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
