import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Users, Eye, Clock, Pin, Lock, ChevronRight } from 'lucide-react';

const ForumMain = () => {
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalTopics: 0,
    totalPosts: 0,
    totalUsers: 0,
    onlineUsers: 0
  });

  // Загружаем данные с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Пока что оставляем пустые массивы, так как у нас нет тем и категорий
        setCategories([]);
        setStats({
          totalTopics: 0,
          totalPosts: 0,
          totalUsers: 0,
          onlineUsers: 0
        });
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    fetchData();
  }, []);

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
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          Добро пожаловать на официальный форум сервера Arizona DRIP
        </p>
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
        {categories.length > 0 ? categories.map((category) => (
          <div key={category.id} className="card p-0 overflow-hidden">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{category.icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">{category.name}</h2>
                    <p className="text-gray-300">{category.description}</p>
                  </div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="text-sm text-gray-400 mb-1">Тем: {category.topics}</div>
                  <div className="text-sm text-gray-400">Сообщений: {category.posts}</div>
                </div>
              </div>
            </div>

            {/* Subcategories */}
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

            {/* Last Post */}
            <div className="p-4 bg-black/20 border-t border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-white font-medium">{category.lastPost.title}</div>
                    <div className="text-xs text-gray-400">
                      от <span className="text-purple-400">{category.lastPost.author}</span> • {category.lastPost.time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default ForumMain;