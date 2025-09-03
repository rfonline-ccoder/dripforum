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

  // Mock data - replace with API calls
  useEffect(() => {
    const mockCategories = [
      {
        id: 1,
        name: 'Общие обсуждения',
        description: 'Общие темы и обсуждения сервера',
        icon: '💬',
        topics: 1234,
        posts: 15678,
        lastPost: {
          title: 'Обновление сервера 2.5',
          author: 'AdminUser',
          time: '5 минут назад'
        },
        subcategories: [
          { id: 11, name: 'Новости сервера', topics: 45, posts: 892 },
          { id: 12, name: 'Общение', topics: 456, posts: 7834 }
        ]
      },
      {
        id: 2,
        name: 'Заявки',
        description: 'Подача заявок на различные должности',
        icon: '📝',
        topics: 567,
        posts: 2341,
        lastPost: {
          title: 'Заявка на администратора',
          author: 'NewPlayer123',
          time: '15 минут назад'
        },
        subcategories: [
          { id: 21, name: 'Заявки в администрацию', topics: 123, posts: 456 },
          { id: 22, name: 'Заявки на лидерство', topics: 89, posts: 234 }
        ]
      },
      {
        id: 3,
        name: 'Жалобы',
        description: 'Подача жалоб на игроков и администрацию',
        icon: '⚖️',
        topics: 234,
        posts: 1234,
        lastPost: {
          title: 'Жалоба на читерство',
          author: 'ReportUser',
          time: '1 час назад'
        },
        subcategories: [
          { id: 31, name: 'Жалобы на игроков', topics: 156, posts: 789 },
          { id: 32, name: 'Жалобы на администрацию', topics: 23, posts: 134 }
        ]
      },
      {
        id: 4,
        name: 'Разное',
        description: 'Флуд, игры и прочее',
        icon: '🎮',
        topics: 789,
        posts: 5678,
        lastPost: {
          title: 'Игра в слова',
          author: 'GamerPro',
          time: '2 часа назад'
        },
        subcategories: [
          { id: 41, name: 'Флуд', topics: 345, posts: 2345 },
          { id: 42, name: 'Игры', topics: 234, posts: 1456 }
        ]
      }
    ];

    setCategories(mockCategories);
    setStats({
      totalTopics: 2824,
      totalPosts: 24931,
      totalUsers: 15234,
      onlineUsers: 156
    });
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
        {categories.map((category) => (
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
        ))}
      </div>

      {/* Online Users */}
      <div className="card p-6 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">Кто онлайн</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-300">
          <Users className="w-4 h-4" />
          <span>Сейчас на форуме: <strong className="text-purple-400">{stats.onlineUsers}</strong> пользователей</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
              User{i + 1}
            </span>
          ))}
          <span className="text-gray-400 text-xs px-2 py-1">и еще {stats.onlineUsers - 10}...</span>
        </div>
      </div>
    </div>
  );
};

export default ForumMain;