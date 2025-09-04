const mysql = require('mysql2/promise');
const config = require('./config.json');
const bcrypt = require('bcrypt');

const createUsersForce = async () => {
  const connection = await mysql.createConnection(config.database);
  
  try {
    console.log('🚀 Принудительно создаем тестовых пользователей...\n');
    
    // Очищаем дублирующиеся группы и достижения
    console.log('🧹 Очищаем дублирующиеся записи...');
    await connection.execute('DELETE FROM user_groups WHERE id > 6');
    await connection.execute('DELETE FROM achievements WHERE id > 5');
    await connection.execute('ALTER TABLE user_groups AUTO_INCREMENT = 7');
    await connection.execute('ALTER TABLE achievements AUTO_INCREMENT = 6');
    
    // Очищаем таблицу пользователей
    console.log('🧹 Очищаем таблицу пользователей...');
    await connection.execute('DELETE FROM users');
    await connection.execute('ALTER TABLE users AUTO_INCREMENT = 1');
    
    // Очищаем связи пользователей и достижений
    await connection.execute('DELETE FROM user_achievements');
    await connection.execute('ALTER TABLE user_achievements AUTO_INCREMENT = 1');
    
    console.log('✅ Таблицы очищены\n');
    
    // Создаем тестовых пользователей
    const users = [
      {
        username: 'admin',
        email: 'admin@forum.com',
        password: 'admin123',
        role: 'admin',
        group_id: 4,
        bio: 'Главный администратор форума. Всегда готов помочь!',
        signature: 'С уважением, Администрация форума',
        posts_count: 156,
        topics_count: 23,
        reputation: 892
      },
      {
        username: 'moderator',
        email: 'mod@forum.com',
        password: 'mod123',
        role: 'moderator',
        group_id: 3,
        bio: 'Модератор форума. Слежу за порядком и помогаю пользователям.',
        signature: 'Модерация - это не только контроль, но и помощь!',
        posts_count: 89,
        topics_count: 12,
        reputation: 456
      },
      {
        username: 'vip_user',
        email: 'vip@forum.com',
        password: 'vip123',
        role: 'user',
        group_id: 2,
        bio: 'VIP пользователь форума. Люблю делиться опытом и помогать новичкам.',
        signature: 'VIP - это не только статус, но и ответственность!',
        posts_count: 234,
        topics_count: 45,
        reputation: 678
      },
      {
        username: 'veteran',
        email: 'veteran@forum.com',
        password: 'vet123',
        role: 'user',
        group_id: 5,
        bio: 'Ветеран форума. Здесь уже много лет, знаю все тонкости.',
        signature: 'Опыт приходит с годами, мудрость - с опытом!',
        posts_count: 567,
        topics_count: 78,
        reputation: 1234
      },
      {
        username: 'newbie',
        email: 'new@forum.com',
        password: 'new123',
        role: 'user',
        group_id: 6,
        bio: 'Новичок на форуме. Учусь и развиваюсь вместе с сообществом.',
        signature: 'Каждый эксперт когда-то был новичком!',
        posts_count: 12,
        topics_count: 2,
        reputation: 45
      },
      {
        username: 'gamer',
        email: 'gamer@forum.com',
        password: 'game123',
        role: 'user',
        group_id: 1,
        bio: 'Заядлый геймер. Обсуждаю игры, делюсь впечатлениями и советами.',
        signature: 'Игры - это не просто развлечение, это искусство!',
        posts_count: 189,
        topics_count: 34,
        reputation: 567
      },
      {
        username: 'programmer',
        email: 'dev@forum.com',
        password: 'dev123',
        role: 'user',
        group_id: 1,
        bio: 'Программист. Помогаю с кодом, делюсь знаниями и опытом.',
        signature: 'Код - это поэзия для компьютера!',
        posts_count: 298,
        topics_count: 56,
        reputation: 789
      },
      {
        username: 'musician',
        email: 'music@forum.com',
        password: 'music123',
        role: 'user',
        group_id: 1,
        bio: 'Музыкант. Обсуждаю музыку, инструменты и творчество.',
        signature: 'Музыка - это язык души!',
        posts_count: 145,
        topics_count: 28,
        reputation: 432
      },
      {
        username: 'artist',
        email: 'art@forum.com',
        password: 'art123',
        role: 'user',
        group_id: 1,
        bio: 'Художник. Делиюсь своими работами и обсуждаю искусство.',
        signature: 'Искусство - это способ видеть мир по-другому!',
        posts_count: 167,
        topics_count: 31,
        reputation: 543
      },
      {
        username: 'sportsman',
        email: 'sport@forum.com',
        password: 'sport123',
        role: 'user',
        group_id: 1,
        bio: 'Спортсмен. Обсуждаю тренировки, соревнования и здоровый образ жизни.',
        signature: 'Спорт - это жизнь, движение - это здоровье!',
        posts_count: 134,
        topics_count: 25,
        reputation: 398
      }
    ];

    console.log('👥 Создаем пользователей...');
    
    for (const user of users) {
      try {
        const passwordHash = await bcrypt.hash(user.password, 10);
        
        const [result] = await connection.execute(`
          INSERT INTO users (
            username, email, password_hash, role, group_id, bio, signature,
            posts_count, topics_count, reputation, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          user.username, user.email, passwordHash, user.role, user.group_id,
          user.bio, user.signature, user.posts_count, user.topics_count, user.reputation, 'active'
        ]);
        
        const userId = result.insertId;
        console.log(`✅ Создан пользователь: ${user.username} (ID: ${userId})`);
        
        // Даем достижения пользователям
        if (user.posts_count > 100) {
          await connection.execute(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            [userId, 2] // Активный участник
          );
        }
        
        if (user.role === 'admin' || user.role === 'moderator') {
          await connection.execute(
            'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
            [userId, 4] // Помощник
          );
        }
      } catch (error) {
        console.error(`❌ Ошибка создания пользователя ${user.username}:`, error.message);
      }
    }

    console.log('\n🎉 === ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ СОЗДАНЫ ===');
    console.log('🔑 Логины и пароли:');
    console.log('admin / admin123');
    console.log('moderator / mod123');
    console.log('vip_user / vip123');
    console.log('veteran / vet123');
    console.log('newbie / new123');
    console.log('gamer / game123');
    console.log('programmer / dev123');
    console.log('musician / music123');
    console.log('artist / art123');
    console.log('sportsman / sport123');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await connection.end();
  }
};

createUsersForce();
