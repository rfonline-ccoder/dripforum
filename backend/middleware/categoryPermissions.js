const mysql = require('mysql2/promise');
const config = require('../config');

// Функция для получения подключения к БД
const getDbConnection = async () => {
  return await mysql.createConnection(config.database);
};

// Функция для проверки прав доступа к категории
const checkCategoryPermission = (permissionType) => {
  return async (req, res, next) => {
    try {
      const categoryId = req.params.id;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ message: 'Необходима авторизация' });
      }

      const connection = await getDbConnection();
      
      // Получаем информацию о категории
      const [categories] = await connection.execute(
        'SELECT * FROM categories WHERE id = ?',
        [categoryId]
      );

      if (categories.length === 0) {
        await connection.end();
        return res.status(404).json({ message: 'Категория не найдена' });
      }

      const category = categories[0];
      
      // Парсим права доступа
      const viewPermissions = JSON.parse(category.view_permissions || '["all"]');
      const createTopicPermissions = JSON.parse(category.create_topic_permissions || '["admin"]');
      const createSubcategoryPermissions = JSON.parse(category.create_subcategory_permissions || '["admin"]');
      const postPermissions = JSON.parse(category.post_permissions || '["all"]');
      const moderatePermissions = JSON.parse(category.moderate_permissions || '["admin", "moderator"]');

      let hasPermission = false;
      let requiredPermissions = [];

      switch (permissionType) {
        case 'view':
          requiredPermissions = viewPermissions;
          break;
        case 'create_topic':
          requiredPermissions = createTopicPermissions;
          break;
        case 'create_subcategory':
          requiredPermissions = createSubcategoryPermissions;
          break;
        case 'post':
          requiredPermissions = postPermissions;
          break;
        case 'moderate':
          requiredPermissions = moderatePermissions;
          break;
        default:
          await connection.end();
          return res.status(400).json({ message: 'Неверный тип разрешения' });
      }

      // Проверяем права доступа
      if (requiredPermissions.includes('all')) {
        hasPermission = true;
      } else if (requiredPermissions.includes(user.role)) {
        hasPermission = true;
      } else if (user.role === 'admin') {
        // Админы всегда имеют доступ
        hasPermission = true;
      }

      // Дополнительные проверки для заблокированных/скрытых категорий
      if (category.is_hidden && !hasPermission) {
        await connection.end();
        return res.status(404).json({ message: 'Категория не найдена' });
      }

      if (category.is_locked && !moderatePermissions.includes(user.role) && user.role !== 'admin') {
        await connection.end();
        return res.status(403).json({ message: 'Категория заблокирована' });
      }

      await connection.end();

      if (!hasPermission) {
        return res.status(403).json({ message: 'Недостаточно прав доступа' });
      }

      // Добавляем информацию о категории в запрос
      req.category = category;
      next();

    } catch (error) {
      console.error('Ошибка проверки прав доступа к категории:', error);
      res.status(500).json({ message: 'Ошибка сервера при проверке прав доступа' });
    }
  };
};

// Функция для проверки наследования прав от родительской категории
const checkInheritedPermissions = async (categoryId, user, permissionType) => {
  try {
    const connection = await getDbConnection();
    
    // Получаем цепочку родительских категорий
    let currentCategoryId = categoryId;
    const categoryChain = [];
    
    while (currentCategoryId) {
      const [categories] = await connection.execute(
        'SELECT id, parent_id, view_permissions, create_topic_permissions, create_subcategory_permissions, post_permissions, moderate_permissions, is_locked, is_hidden FROM categories WHERE id = ?',
        [currentCategoryId]
      );
      
      if (categories.length === 0) break;
      
      const category = categories[0];
      categoryChain.push(category);
      currentCategoryId = category.parent_id;
    }
    
    await connection.end();
    
    // Проверяем права в цепочке от дочерней к родительской
    for (const category of categoryChain) {
      const permissions = JSON.parse(category[`${permissionType}_permissions`] || '["all"]');
      
      if (category.is_hidden && !permissions.includes('all') && !permissions.includes(user.role) && user.role !== 'admin') {
        return false;
      }
      
      if (category.is_locked && !JSON.parse(category.moderate_permissions || '["admin", "moderator"]').includes(user.role) && user.role !== 'admin') {
        return false;
      }
      
      if (!permissions.includes('all') && !permissions.includes(user.role) && user.role !== 'admin') {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('Ошибка проверки наследования прав:', error);
    return false;
  }
};

module.exports = {
  checkCategoryPermission,
  checkInheritedPermissions
};
