const mysql = require('mysql2/promise');
const config = require('./config.json');

const clearForumData = async () => {
  const connection = await mysql.createConnection(config.database);
  
  try {
    console.log('Очищаем данные форума...');
    
    // Удаляем все посты
    await connection.execute('DELETE FROM posts');
    console.log('✓ Посты удалены');
    
    // Удаляем все темы
    await connection.execute('DELETE FROM topics');
    console.log('✓ Темы удалены');
    
    // Сбрасываем автоинкремент
    await connection.execute('ALTER TABLE posts AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE topics AUTO_INCREMENT = 1');
    
    console.log('✓ Автоинкремент сброшен');
    console.log('Все темы и посты удалены!');
    
  } catch (error) {
    console.error('Ошибка очистки:', error);
  } finally {
    await connection.end();
  }
};

clearForumData();
