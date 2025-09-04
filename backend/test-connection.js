const mysql = require('mysql2/promise');
const config = require('./config.local.json');

async function testConnection() {
  try {
    console.log('🔌 Тестирую подключение к базе данных...');
    console.log('📊 Конфигурация:', {
      host: config.database.host,
      user: config.database.user,
      database: config.database.database,
      port: config.database.port
    });

    const connection = await mysql.createConnection(config.database);
    console.log('✅ Подключение к БД успешно!');

    // Проверяем таблицы
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Таблицы в БД:', tables.map(t => Object.values(t)[0]));

    // Проверяем пользователей
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Пользователей в БД: ${users[0].count}`);

    await connection.end();
    console.log('✅ Тест подключения завершен успешно!');
    
    console.log('\n🚀 Теперь можно запускать сервер:');
    console.log('npm start');
    
  } catch (error) {
    console.error('❌ Ошибка подключения:', error.message);
    console.log('\n🔧 Возможные решения:');
    console.log('1. Проверьте, что MySQL сервер запущен');
    console.log('2. Проверьте настройки в config.local.json');
    console.log('3. Убедитесь, что IP адрес 89.169.1.168 доступен');
  }
}

testConnection();
