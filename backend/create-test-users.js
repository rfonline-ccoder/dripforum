const mysql = require('mysql2/promise');
const config = require('./config.json');
const bcrypt = require('bcrypt');

const createTestUsers = async () => {
  const connection = await mysql.createConnection(config.database);
  
  try {
    console.log('Создаем тестовых пользователей...');
    
    // Создаем таблицу пользователей если её нет
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
        group_id INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        joinDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        posts_count INT DEFAULT 0,
        topics_count INT DEFAULT 0,
        reputation INT DEFAULT 0,
        bio TEXT,
        signature TEXT,
        avatar_url VARCHAR(255),
        is_banned BOOLEAN DEFAULT FALSE,
        ban_reason TEXT,
        ban_expires TIMESTAMP NULL,
        is_muted BOOLEAN DEFAULT FALSE,
        mute_reason TEXT,
        mute_expires TIMESTAMP NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status ENUM('active', 'banned') DEFAULT 'active'
      )
    `);

    // Добавляем недостающие поля в существующую таблицу
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN group_id INT DEFAULT 1');
    } catch (error) {
      // Поле уже существует
    }

    // Добавляем недостающее поле last_login
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (error) {
      // Поле уже существует
    }

    // Добавляем недостающее поле role
    try {
      await connection.execute('ALTER TABLE users ADD COLUMN role ENUM("user", "moderator", "admin") DEFAULT "user"');
    } catch (error) {
      // Поле уже существует
    }

    // Исправляем поле id чтобы было AUTO_INCREMENT
    try {
      await connection.execute('ALTER TABLE users MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY');
    } catch (error) {
      // Поле уже исправлено
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN joinDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN posts_count INT DEFAULT 0');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN topics_count INT DEFAULT 0');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN reputation INT DEFAULT 0');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN bio TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN signature TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN is_banned BOOLEAN DEFAULT FALSE');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN ban_reason TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN ban_expires TIMESTAMP NULL');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN is_muted BOOLEAN DEFAULT FALSE');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN mute_reason TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN mute_expires TIMESTAMP NULL');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN ip_address VARCHAR(45)');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN user_agent TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE users ADD COLUMN status ENUM("active", "banned") DEFAULT "active"');
    } catch (error) {
      // Поле уже существует
    }

    // Создаем таблицу групп пользователей если её нет
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        color VARCHAR(7) DEFAULT '#ffffff',
        css_styles TEXT,
        permissions JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Добавляем недостающие поля в таблицу групп
    try {
      await connection.execute('ALTER TABLE user_groups ADD COLUMN css_styles TEXT');
    } catch (error) {
      // Поле уже существует
    }

    try {
      await connection.execute('ALTER TABLE user_groups ADD COLUMN permissions JSON');
    } catch (error) {
      // Поле уже существует
    }

    // Исправляем поле id в таблице групп
    try {
      await connection.execute('ALTER TABLE user_groups MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY');
    } catch (error) {
      // Поле уже исправлено
    }

    // Создаем таблицу достижений если её нет
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        color VARCHAR(7) DEFAULT '#ffffff',
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Исправляем поле id в таблице достижений
    try {
      await connection.execute('ALTER TABLE achievements MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY');
    } catch (error) {
      // Поле уже исправлено
    }

    // Создаем таблицу связи пользователей и достижений если её нет
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        achievement_id INT NOT NULL,
        awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Исправляем поле id в таблице связи
    try {
      await connection.execute('ALTER TABLE user_achievements MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY');
    } catch (error) {
      // Поле уже исправлено
    }

    // Создаем базовые группы пользователей
    const groups = [
      { name: 'Пользователь', color: '#ffffff' },
      { name: 'VIP', color: '#ffd700' },
      { name: 'Модератор', color: '#00ff00' },
      { name: 'Администратор', color: '#ff0000' },
      { name: 'Ветеран', color: '#9370db' },
      { name: 'Новичок', color: '#87ceeb' }
    ];

    for (const group of groups) {
      try {
        await connection.execute(
          'INSERT INTO user_groups (name, color) VALUES (?, ?)',
          [group.name, group.color]
        );
      } catch (error) {
        // Группа уже существует
      }
    }

    // Создаем базовые достижения
    const achievements = [
      { name: 'Первый пост', description: 'Создал первое сообщение', color: '#87ceeb' },
      { name: 'Активный участник', description: 'Написал 100 сообщений', color: '#32cd32' },
      { name: 'Ветеран форума', description: 'На форуме более года', color: '#9370db' },
      { name: 'Помощник', description: 'Помог другим пользователям', color: '#ffd700' },
      { name: 'Креативщик', description: 'Создал интересную тему', color: '#ff69b4' }
    ];

    for (const achievement of achievements) {
      try {
        await connection.execute(
          'INSERT INTO achievements (name, description, color) VALUES (?, ?, ?)',
          [achievement.name, achievement.description, achievement.color]
        );
      } catch (error) {
        // Достижение уже существует
      }
    }

    // Добавляем foreign key constraints после создания всех таблиц
    try {
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error) {
      // Constraint уже существует
    }

    try {
      await connection.execute(`
        ALTER TABLE user_achievements 
        ADD CONSTRAINT fk_user_achievements_achievement 
        FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
      `);
    } catch (error) {
      // Constraint уже существует
    }



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
      },
      {
        username: 'traveler',
        email: 'travel@forum.com',
        password: 'travel123',
        role: 'user',
        group_id: 1,
        bio: 'Путешественник. Делиюсь впечатлениями от поездок и советами.',
        signature: 'Мир огромен, и его стоит увидеть!',
        posts_count: 203,
        topics_count: 41,
        reputation: 654
      },
      {
        username: 'bookworm',
        email: 'book@forum.com',
        password: 'book123',
        role: 'user',
        group_id: 1,
        bio: 'Книголюб. Обсуждаю литературу, делюсь впечатлениями и рекомендациями.',
        signature: 'Книги - это окно в другие миры!',
        posts_count: 178,
        topics_count: 33,
        reputation: 521
      },
      {
        username: 'cook',
        email: 'cook@forum.com',
        password: 'cook123',
        role: 'user',
        group_id: 1,
        bio: 'Повар. Делиюсь рецептами, советами по готовке и кулинарными находками.',
        signature: 'Готовка - это творчество, а еда - это радость!',
        posts_count: 156,
        topics_count: 29,
        reputation: 487
      },
      {
        username: 'photographer',
        email: 'photo@forum.com',
        password: 'photo123',
        role: 'user',
        group_id: 1,
        bio: 'Фотограф. Показываю свои работы и обсуждаю технику съемки.',
        signature: 'Фотография - это способ остановить время!',
        posts_count: 198,
        topics_count: 37,
        reputation: 612
      },
      {
        username: 'teacher',
        email: 'teach@forum.com',
        password: 'teach123',
        role: 'user',
        group_id: 1,
        bio: 'Учитель. Помогаю с обучением, делюсь педагогическим опытом.',
        signature: 'Обучение - это путь к знаниям и развитию!',
        posts_count: 223,
        topics_count: 42,
        reputation: 689
      },
      {
        username: 'doctor',
        email: 'doc@forum.com',
        password: 'doc123',
        role: 'user',
        group_id: 1,
        bio: 'Врач. Отвечаю на вопросы о здоровье и даю профессиональные советы.',
        signature: 'Здоровье - это самое ценное, что у нас есть!',
        posts_count: 267,
        topics_count: 51,
        reputation: 823
      },
      {
        username: 'lawyer',
        email: 'law@forum.com',
        password: 'law123',
        role: 'user',
        group_id: 1,
        bio: 'Юрист. Помогаю с правовыми вопросами и консультирую по законам.',
        signature: 'Право - это основа справедливого общества!',
        posts_count: 189,
        topics_count: 35,
        reputation: 578
      },
      {
        username: 'designer',
        email: 'design@forum.com',
        password: 'design123',
        role: 'user',
        group_id: 1,
        bio: 'Дизайнер. Делиюсь работами, обсуждаю тренды и даю советы.',
        signature: 'Дизайн - это не только красота, но и функциональность!',
        posts_count: 145,
        topics_count: 27,
        reputation: 456
      },
      {
        username: 'writer',
        email: 'write@forum.com',
        password: 'write123',
        role: 'user',
        group_id: 1,
        bio: 'Писатель. Показываю свои произведения и обсуждаю литературу.',
        signature: 'Слова имеют силу, используйте их мудро!',
        posts_count: 234,
        topics_count: 44,
        reputation: 712
      },
      {
        username: 'scientist',
        email: 'science@forum.com',
        password: 'science123',
        role: 'user',
        group_id: 1,
        bio: 'Ученый. Делиюсь научными знаниями и обсуждаю исследования.',
        signature: 'Наука - это путь к истине и прогрессу!',
        posts_count: 312,
        topics_count: 58,
        reputation: 945
      }
    ];

    // Создаем пользователей
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
        console.log(`✓ Создан пользователь: ${user.username} (ID: ${userId})`);
        
        // Даем достижения пользователям
        if (user.posts_count > 100) {
          try {
            await connection.execute(
              'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
              [userId, 2] // Активный участник
            );
          } catch (error) {
            // Достижение уже выдано
          }
        }
        
        if (user.role === 'admin' || user.role === 'moderator') {
          try {
            await connection.execute(
              'INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)',
              [userId, 4] // Помощник
            );
          } catch (error) {
            // Достижение уже выдано
          }
        }
             } catch (error) {
         console.log(`Пользователь ${user.username} уже существует`);
       }
     }

     console.log('\n=== ТЕСТОВЫЕ ПОЛЬЗОВАТЕЛИ СОЗДАНЫ ===');
    console.log('Логины и пароли:');
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
    console.log('traveler / travel123');
    console.log('bookworm / book123');
    console.log('cook / cook123');
    console.log('photographer / photo123');
    console.log('teacher / teach123');
    console.log('doctor / doc123');
    console.log('lawyer / law123');
    console.log('designer / design123');
    console.log('writer / write123');
    console.log('scientist / science123');
    
  } catch (error) {
    console.error('Ошибка создания пользователей:', error);
  } finally {
    await connection.end();
  }
};

createTestUsers();
