const mysql = require('mysql2/promise');
const config = require('./config.json');

// Стандартные группы пользователей
const defaultGroups = [
  {
    name: 'Администратор',
    color: '#FF4444',
    css_styles: 'font-weight: bold; color: #FF4444;',
    permissions: JSON.stringify(['all'])
  },
  {
    name: 'Модератор',
    color: '#FF8800',
    css_styles: 'font-weight: bold; color: #FF8800;',
    permissions: JSON.stringify(['moderate', 'ban', 'mute', 'edit_posts'])
  },
  {
    name: 'VIP Пользователь',
    color: '#AA00FF',
    css_styles: 'font-weight: bold; color: #AA00FF;',
    permissions: JSON.stringify(['vip_features', 'custom_avatar'])
  },
  {
    name: 'Активный участник',
    color: '#00AA00',
    css_styles: 'font-weight: bold; color: #00AA00;',
    permissions: JSON.stringify(['post', 'comment', 'vote'])
  },
  {
    name: 'Новичок',
    color: '#888888',
    css_styles: 'color: #888888;',
    permissions: JSON.stringify(['post', 'comment'])
  },
  {
    name: 'Заблокированный',
    color: '#666666',
    css_styles: 'color: #666666; text-decoration: line-through;',
    permissions: JSON.stringify([])
  }
];

// Стандартные достижения
const defaultAchievements = [
  {
    name: 'Первый пост',
    description: 'Опубликовал первое сообщение на форуме',
    icon: '📝',
    color: '#4CAF50'
  },
  {
    name: 'Активный писатель',
    description: 'Опубликовал 50 сообщений',
    icon: '✍️',
    color: '#2196F3'
  },
  {
    name: 'Мастер общения',
    description: 'Опубликовал 100 сообщений',
    icon: '💬',
    color: '#9C27B0'
  },
  {
    name: 'Популярный',
    description: 'Получил 100 лайков',
    icon: '👍',
    color: '#FF9800'
  },
  {
    name: 'Помощник',
    description: 'Помог 10 пользователям',
    icon: '🤝',
    color: '#4CAF50'
  },
  {
    name: 'Эксперт',
    description: 'Получил 500 лайков',
    icon: '🏆',
    color: '#FFD700'
  },
  {
    name: 'Ветеран',
    description: 'На форуме более 1 года',
    icon: '🎖️',
    color: '#795548'
  },
  {
    name: 'Креативщик',
    description: 'Создал 10 тем',
    icon: '💡',
    color: '#E91E63'
  },
  {
    name: 'Ночная сова',
    description: 'Активен в ночное время',
    icon: '🦉',
    color: '#607D8B'
  },
  {
    name: 'Ранняя пташка',
    description: 'Активен рано утром',
    icon: '🌅',
    color: '#FF5722'
  }
];

async function initializeData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config.database);
    
    // Проверяем, есть ли уже группы
    const [existingGroups] = await connection.execute('SELECT COUNT(*) as count FROM user_groups');
    
    if (existingGroups[0].count === 0) {
      console.log('Создаем стандартные группы пользователей...');
      
      for (const group of defaultGroups) {
        await connection.execute(`
          INSERT INTO user_groups (name, color, css_styles, permissions, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [group.name, group.color, group.css_styles, group.permissions]);
      }
      
      console.log('✅ Стандартные группы созданы');
    } else {
      console.log('ℹ️ Группы уже существуют, пропускаем создание');
    }
    
    // Проверяем, есть ли уже достижения
    const [existingAchievements] = await connection.execute('SELECT COUNT(*) as count FROM achievements');
    
    if (existingAchievements[0].count === 0) {
      console.log('Создаем стандартные достижения...');
      
      for (const achievement of defaultAchievements) {
        await connection.execute(`
          INSERT INTO achievements (name, description, icon, color, created_at)
          VALUES (?, ?, ?, ?, NOW())
        `, [achievement.name, achievement.description, achievement.icon, achievement.color]);
      }
      
      console.log('✅ Стандартные достижения созданы');
    } else {
      console.log('ℹ️ Достижения уже существуют, пропускаем создание');
    }
    
    console.log('🎉 Инициализация данных завершена');
    
  } catch (error) {
    console.error('❌ Ошибка инициализации данных:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Экспортируем функцию для использования в app.js
module.exports = { initializeData };

// Если файл запущен напрямую
if (require.main === module) {
  initializeData().then(() => {
    console.log('Инициализация завершена');
    process.exit(0);
  }).catch((error) => {
    console.error('Ошибка:', error);
    process.exit(1);
  });
}
