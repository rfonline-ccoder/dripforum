const mysql = require('mysql2/promise');
const config = require('./config.json');

// Функция для создания таблицы user_groups_membership
const createUserGroupsMembershipTable = async (connection) => {
  try {
    console.log('🔧 Проверяем таблицу user_groups_membership...');
    
    // Проверяем, существует ли таблица
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_groups_membership'
    `, [config.database.database]);
    
    if (tables.length === 0) {
      console.log('📝 Создаем таблицу user_groups_membership...');
      
      await connection.execute(`
        CREATE TABLE user_groups_membership (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          group_id INT NOT NULL,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_by VARCHAR(36),
          reason TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE KEY unique_user_group (user_id, group_id),
          INDEX idx_user_id (user_id),
          INDEX idx_group_id (group_id),
          INDEX idx_assigned_at (assigned_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Таблица user_groups_membership создана!');
    } else {
      console.log('✅ Таблица user_groups_membership уже существует');
    }
  } catch (error) {
    console.error('❌ Ошибка при создании таблицы user_groups_membership:', error.message);
  }
};

// Функция для обновления таблицы user_achievements
const updateUserAchievementsTable = async (connection) => {
  try {
    console.log('🔧 Проверяем таблицу user_achievements...');
    
    // Проверяем, есть ли поля awarded_by и reason
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_achievements' AND COLUMN_NAME IN ('awarded_by', 'reason')
    `, [config.database.database]);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('awarded_by')) {
      console.log('📝 Добавляем поле awarded_by в user_achievements...');
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD COLUMN awarded_by VARCHAR(36) AFTER awarded_at,
        ADD FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('✅ Поле awarded_by добавлено!');
    }
    
    if (!existingColumns.includes('reason')) {
      console.log('📝 Добавляем поле reason в user_achievements...');
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD COLUMN reason TEXT AFTER awarded_by
      `);
      console.log('✅ Поле reason добавлено!');
    }
    
    if (existingColumns.includes('awarded_by') && existingColumns.includes('reason')) {
      console.log('✅ Таблица user_achievements уже обновлена');
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении таблицы user_achievements:', error.message);
  }
};

const checkDatabase = async () => {
  const connection = await mysql.createConnection(config.database);
  
  try {
    console.log('🔍 Проверяем содержимое базы данных...\n');
    
    // Создаем таблицу user_groups_membership если её нет
    await createUserGroupsMembershipTable(connection);
    
    // Обновляем таблицу user_achievements если нужно
    await updateUserAchievementsTable(connection);
    
    // Проверяем таблицы
    console.log('📋 Список таблиц:');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(tables);
    
    // Проверяем пользователей
    console.log('\n👥 Пользователи в таблице users:');
    try {
      const [users] = await connection.execute('SELECT id, username, email, role, group_id FROM users LIMIT 10');
      if (users.length === 0) {
        console.log('❌ Таблица users пуста!');
      } else {
        console.log(`✅ Найдено пользователей: ${users.length}`);
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Group: ${user.group_id}`);
        });
      }
    } catch (error) {
      console.log('❌ Ошибка при чтении таблицы users:', error.message);
    }
    
    // Проверяем группы
    console.log('\n🏷️ Группы пользователей:');
    try {
      const [groups] = await connection.execute('SELECT id, name, color FROM user_groups');
      if (groups.length === 0) {
        console.log('❌ Таблица user_groups пуста!');
      } else {
        console.log(`✅ Найдено групп: ${groups.length}`);
        groups.forEach(group => {
          console.log(`  - ID: ${group.id}, Name: ${group.name}, Color: ${group.color}`);
        });
      }
    } catch (error) {
      console.log('❌ Ошибка при чтении таблицы user_groups:', error.message);
    }
    
    // Проверяем достижения
    console.log('\n🏆 Достижения:');
    try {
      const [achievements] = await connection.execute('SELECT id, name, description FROM achievements');
      if (achievements.length === 0) {
        console.log('❌ Таблица achievements пуста!');
      } else {
        console.log(`✅ Найдено достижений: ${achievements.length}`);
        achievements.forEach(achievement => {
          console.log(`  - ID: ${achievement.id}, Name: ${achievement.name}`);
        });
      }
    } catch (error) {
      console.log('❌ Ошибка при чтении таблицы achievements:', error.message);
    }
    
    // Проверяем членство в группах
    console.log('\n👥 Членство в группах:');
    try {
      const [memberships] = await connection.execute(`
        SELECT ugm.id, u.username, ug.name as group_name, ugm.assigned_at 
        FROM user_groups_membership ugm
        LEFT JOIN users u ON ugm.user_id = u.id
        LEFT JOIN user_groups ug ON ugm.group_id = ug.id
        LIMIT 10
      `);
      if (memberships.length === 0) {
        console.log('ℹ️ Таблица user_groups_membership пуста (это нормально для новых установок)');
      } else {
        console.log(`✅ Найдено записей членства: ${memberships.length}`);
        memberships.forEach(membership => {
          console.log(`  - User: ${membership.username}, Group: ${membership.group_name}, Assigned: ${membership.assigned_at}`);
        });
      }
    } catch (error) {
      console.log('❌ Ошибка при чтении таблицы user_groups_membership:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе:', error.message);
  } finally {
    await connection.end();
  }
};

checkDatabase();
