const mysql = require('mysql2/promise');

async function testConnection() {
  const configs = [
    {
      name: 'Удаленная база (89.169.1.168)',
      host: '89.169.1.168',
      port: 3306,
      user: 'hesus',
      password: '',
      database: 'dripforum'
    },
    {
      name: 'Удаленная база без указания БД',
      host: '89.169.1.168',
      port: 3306,
      user: 'hesus',
      password: ''
    }
  ];

  for (const dbConfig of configs) {
    try {
      console.log(`\n🔍 Тестирую подключение к ${dbConfig.name}...`);
      
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectTimeout: 10000
      });

      console.log(`✅ Успешное подключение к ${dbConfig.name}`);
      
      if (dbConfig.database) {
        const [rows] = await connection.execute('SHOW TABLES');
        console.log(`📊 Найдено таблиц: ${rows.length}`);
      }
      
      await connection.end();
      
    } catch (error) {
      console.log(`❌ Ошибка подключения к ${dbConfig.name}:`, error.message);
    }
  }
}

testConnection().catch(console.error);
