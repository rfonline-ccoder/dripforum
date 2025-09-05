-- Добавляем поля прав доступа к таблице categories
ALTER TABLE categories 
ADD COLUMN view_permissions JSON DEFAULT '["all"]' COMMENT 'Роли, которые могут видеть категорию',
ADD COLUMN create_topic_permissions JSON DEFAULT '["admin"]' COMMENT 'Роли, которые могут создавать темы',
ADD COLUMN create_subcategory_permissions JSON DEFAULT '["admin"]' COMMENT 'Роли, которые могут создавать подкатегории',
ADD COLUMN post_permissions JSON DEFAULT '["all"]' COMMENT 'Роли, которые могут писать сообщения в темах',
ADD COLUMN moderate_permissions JSON DEFAULT '["admin", "moderator"]' COMMENT 'Роли, которые могут модерировать категорию',
ADD COLUMN is_locked BOOLEAN DEFAULT FALSE COMMENT 'Заблокирована ли категория для всех кроме модераторов',
ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE COMMENT 'Скрыта ли категория от обычных пользователей';

-- Обновляем существующие категории с базовыми правами
UPDATE categories SET 
  view_permissions = '["all"]',
  create_topic_permissions = '["admin"]',
  create_subcategory_permissions = '["admin"]',
  post_permissions = '["all"]',
  moderate_permissions = '["admin", "moderator"]',
  is_locked = FALSE,
  is_hidden = FALSE;
