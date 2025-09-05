const mysql = require('mysql2/promise');
const config = require('./config');

async function updateCategoriesPermissionsTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.database);
    console.log('🔧 Проверяем поля прав доступа в таблице categories...');

    // Проверяем существование полей
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories' AND COLUMN_NAME IN (
        'view_permissions', 'create_topic_permissions', 'create_subcategory_permissions', 
        'post_permissions', 'moderate_permissions', 'is_locked', 'is_hidden'
      )
    `, [config.database.database]);

    const existingColumns = columns.map(row => row.COLUMN_NAME);
    const requiredColumns = [
      'view_permissions', 'create_topic_permissions', 'create_subcategory_permissions',
      'post_permissions', 'moderate_permissions', 'is_locked', 'is_hidden'
    ];

    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log(`📝 Добавляем недостающие поля: ${missingColumns.join(', ')}`);
      
      for (const column of missingColumns) {
        let columnDefinition;
        switch (column) {
          case 'view_permissions':
            columnDefinition = "ADD COLUMN view_permissions JSON DEFAULT '[\"all\"]' COMMENT 'Роли, которые могут видеть категорию'";
            break;
          case 'create_topic_permissions':
            columnDefinition = "ADD COLUMN create_topic_permissions JSON DEFAULT '[\"admin\"]' COMMENT 'Роли, которые могут создавать темы'";
            break;
          case 'create_subcategory_permissions':
            columnDefinition = "ADD COLUMN create_subcategory_permissions JSON DEFAULT '[\"admin\"]' COMMENT 'Роли, которые могут создавать подкатегории'";
            break;
          case 'post_permissions':
            columnDefinition = "ADD COLUMN post_permissions JSON DEFAULT '[\"all\"]' COMMENT 'Роли, которые могут писать сообщения в темах'";
            break;
          case 'moderate_permissions':
            columnDefinition = "ADD COLUMN moderate_permissions JSON DEFAULT '[\"admin\", \"moderator\"]' COMMENT 'Роли, которые могут модерировать категорию'";
            break;
          case 'is_locked':
            columnDefinition = "ADD COLUMN is_locked BOOLEAN DEFAULT FALSE COMMENT 'Заблокирована ли категория для всех кроме модераторов'";
            break;
          case 'is_hidden':
            columnDefinition = "ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE COMMENT 'Скрыта ли категория от обычных пользователей'";
            break;
        }
        
        await connection.execute(`ALTER TABLE categories ${columnDefinition}`);
        console.log(`✅ Добавлено поле: ${column}`);
      }

      // Обновляем существующие категории с базовыми правами
      await connection.execute(`
        UPDATE categories SET 
          view_permissions = '["all"]',
          create_topic_permissions = '["admin"]',
          create_subcategory_permissions = '["admin"]',
          post_permissions = '["all"]',
          moderate_permissions = '["admin", "moderator"]',
          is_locked = FALSE,
          is_hidden = FALSE
        WHERE view_permissions IS NULL OR create_topic_permissions IS NULL
      `);
      
      console.log('✅ Обновлены права доступа для существующих категорий');
    } else {
      console.log('✅ Все поля прав доступа уже существуют');
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении таблицы categories:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = { updateCategoriesPermissionsTable };
