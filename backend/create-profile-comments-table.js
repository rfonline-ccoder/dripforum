const mysql = require('mysql2/promise');
const config = require('./config.json');

async function createProfileCommentsTable() {
  let connection;
  
  try {
    // Подключение к базе данных
    connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      port: config.database.port
    });

    console.log('✅ Подключение к базе данных установлено');

    // Читаем SQL файл
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'database', 'create-profile-comments-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Выполняем SQL
    await connection.execute(sql);
    console.log('✅ Таблица profile_comments успешно создана');

  } catch (error) {
    console.error('❌ Ошибка при создании таблицы:', error.message);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Таблица уже существует');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Соединение с базой данных закрыто');
    }
  }
}

// Запускаем создание таблицы
createProfileCommentsTable();
