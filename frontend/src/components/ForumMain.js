import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Eye, Clock, Pin, Lock, ChevronRight, Plus, X } from 'lucide-react';
import config from '../config';

const ForumMain = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalTopics: 0,
    totalPosts: 0,
    totalUsers: 0,
    onlineUsers: 0
  });
  const [user, setUser] = useState(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    icon: '📁',
    parent_id: null,
    position: 0
  });
  const [isCreating, setIsCreating] = useState(false);

  // Загружаем данные с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Загружаем информацию о пользователе
        if (token) {
          try {
            const userResponse = await fetch(`${config.api.backendUrl}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData.user);
            }
          } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
          }
        }

        // Загружаем категории из API
        const response = await fetch(`${config.api.backendUrl}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const categoriesData = await response.json();
          console.log('Загружены категории:', categoriesData);
          setCategories(categoriesData);
        } else {
          console.error('Ошибка загрузки категорий:', response.statusText);
          setCategories([]);
        }

        // TODO: Загрузить статистику с сервера
        setStats({
          totalTopics: 0,
          totalPosts: 0,
          totalUsers: 0,
          onlineUsers: 0
        });
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        setCategories([]);
      }
    };

    fetchData();
  }, []);

  // Функция для создания категории
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    setIsCreating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        const createdCategory = await response.json();
        setCategories(prev => [...prev, createdCategory]);
        setShowCreateCategoryModal(false);
        setNewCategory({
          name: '',
          description: '',
          icon: '📁',
          parent_id: null,
          position: 0
        });
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка создания категории');
      }
    } catch (error) {
      console.error('Ошибка создания категории:', error);
      alert('Ошибка создания категории');
    } finally {
      setIsCreating(false);
    }
  };

  // Получаем только родительские категории для выбора
  const parentCategories = categories.filter(cat => !cat.parent_id);
  
  // Группируем категории: основные и подкатегории
  const mainCategories = categories.filter(cat => !cat.parent_id);
  const subcategories = categories.filter(cat => cat.parent_id);
  
  // Добавляем подкатегории к основным категориям
  const categoriesWithSubs = mainCategories.map(category => ({
    ...category,
    subcategories: subcategories.filter(sub => sub.parent_id === category.id)
  }));

  console.log('Все категории:', categories);
  console.log('Основные категории:', mainCategories);
  console.log('Подкатегории:', subcategories);
  console.log('Категории с подкатегориями:', categoriesWithSubs);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Forum Header */}
      <div className="mb-8 text-center">
        <div className="mb-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 neon-glow">
              ARIZONA
            </span>
          </h1>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-white mb-4">
            DRIP <span className="text-purple-400">FORUM</span>
          </h2>
        </div>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto mb-6">
          Добро пожаловать на официальный форум сервера Arizona DRIP
        </p>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreateCategoryModal(true)}
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Создать категорию</span>
          </button>
        )}
      </div>

      {/* Forum Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">{stats.totalTopics.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Тем</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400 mb-1">{stats.totalPosts.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Сообщений</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Пользователей</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">{stats.onlineUsers}</div>
          <div className="text-sm text-gray-400">Онлайн</div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {categoriesWithSubs.length > 0 ? categoriesWithSubs.map((category) => (
          <div key={category.id} className="card p-0 overflow-hidden">
            {/* Category Header */}
            <Link to={`/category.${category.id}`} className="block hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-cyan-600/30 transition-all duration-200">
              <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{category.icon || '📁'}</div>
                    <div>
                      <h2 className="text-xl font-bold text-white mb-1">{category.name}</h2>
                      <p className="text-gray-300">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block">
                    <div className="text-sm text-gray-400 mb-1">Тем: {category.topics || 0}</div>
                    <div className="text-sm text-gray-400">Сообщений: {category.posts || 0}</div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Subcategories */}
            {category.subcategories && category.subcategories.length > 0 && (
              <div className="divide-y divide-white/10">
                {category.subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  to={`/category/${subcategory.id}`}
                  className="block p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {subcategory.name}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {subcategory.topics} тем
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {subcategory.posts} сообщений
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                </Link>
                ))}
              </div>
            )}

          </div>
        )) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-white mb-2">Форум пуст</h3>
            <p className="text-gray-400 mb-6">
              Пока что здесь нет ни тем, ни категорий. 
              <br />
              Администраторы могут создать первые категории для обсуждений.
            </p>
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto mb-4"
              >
                <Plus className="w-5 h-5" />
                <span>Создать первую категорию</span>
              </button>
            )}
            <div className="text-sm text-gray-500">
              Создано тестовых пользователей: 20
            </div>
          </div>
        )}
      </div>

      {/* Online Users */}
      <div className="card p-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Кто онлайн</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Users className="w-4 h-4" />
          <span>Сейчас на форуме: <strong className="text-purple-400">{stats.onlineUsers}</strong> пользователей</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {stats.onlineUsers > 0 ? (
            <>
              {Array.from({ length: Math.min(10, stats.onlineUsers) }).map((_, i) => (
            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
              User{i + 1}
            </span>
          ))}
              {stats.onlineUsers > 10 && (
          <span className="text-gray-400 text-xs px-2 py-1">и еще {stats.onlineUsers - 10}...</span>
              )}
            </>
          ) : (
            <span className="text-gray-500 text-sm">Нет пользователей онлайн</span>
          )}
        </div>
      </div>

      {/* Модальное окно создания категории */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Создать категорию</h3>
              <button
                onClick={() => setShowCreateCategoryModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название категории
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Введите название категории"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="Введите описание категории"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Иконка (эмодзи)
                </label>
                <input
                  type="text"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="📁"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Родительская категория (опционально)
                </label>
                <select
                  value={newCategory.parent_id || ''}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, parent_id: e.target.value || null }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Основная категория</option>
                  {parentCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Позиция
                </label>
                <input
                  type="number"
                  value={newCategory.position}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-lg hover:from-purple-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumMain;