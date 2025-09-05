const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

const config = require('./config.json');

const createUserAchievementsTable = async () => {
  try {
    const connection = await mysql.createConnection(config.database);
    
    // Читаем SQL файл
    const sqlFile = path.join(__dirname, 'database', 'create-user-achievements-table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Выполняем SQL
    await connection.execute(sql);
    
    console.log('✅ Таблица user_achievements создана успешно');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Ошибка создания таблицы user_achievements:', error);
  }
};

createUserAchievementsTable();
