const mysql = require('mysql2/promise');
const config = require('../config.json');

const dbConfig = {
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectionLimit: 10,
  queueLimit: 0,
  waitForConnections: true
};

// Создание пула соединений
const pool = mysql.createPool(dbConfig);

// Тестирование подключения
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Подключение к MySQL успешно установлено');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    return false;
  }
}

// Получение соединения из пула
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('Ошибка получения соединения:', error);
    throw error;
  }
}

// Выполнение запроса
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Ошибка выполнения запроса:', error);
    throw error;
  }
}

// Выполнение транзакции
async function transaction(callback) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  getConnection,
  query,
  transaction,
  dbConfig
};
