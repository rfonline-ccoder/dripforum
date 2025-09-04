const mysql = require('mysql2/promise');
const config = require('./config.json');

const checkDatabase = async () => {
  const connection = await mysql.createConnection(config.database);
  
  try {
    console.log('🔍 Проверяем содержимое базы данных...\n');
    
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
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе:', error.message);
  } finally {
    await connection.end();
  }
};

checkDatabase();
