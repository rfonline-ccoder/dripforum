const mysql = require('mysql2/promise');
const config = require('./config.json');

const checkUsers = async () => {
  try {
    console.log('🔍 Проверяем подключение к базе данных...');
    console.log('📊 Конфигурация:', JSON.stringify(config.database, null, 2));
    
    const connection = await mysql.createConnection(config.database);
    console.log('✅ Подключение к базе успешно!');
    
    // Проверяем пользователей
    const [users] = await connection.execute('SELECT id, username, email, role FROM users LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ Пользователей нет! Нужно создать.');
    } else {
      console.log(`✅ Найдено пользователей: ${users.length}`);
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role}) - ${user.email}`);
      });
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Возможные решения:');
      console.log('1. Проверь, что MySQL сервер запущен на 89.169.1.168:3306');
      console.log('2. Проверь, что пользователь hesus имеет доступ');
      console.log('3. Проверь firewall на сервере');
    }
  }
};

checkUsers();
