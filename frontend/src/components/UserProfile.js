import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Calendar, MessageCircle, Eye, Award, Settings, Edit3, Mail, MapPin } from 'lucide-react';

const UserProfile = ({ user: currentUser }) => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Mock data - replace with API call
    const mockUser = {
      id: parseInt(id) || currentUser?.id || 1,
      username: 'AdminUser',
      email: 'admin@arizonadrip.com',
      role: 'admin',
      avatar: null,
      joinDate: '2023-01-15T10:30:00Z',
      lastActivity: '2024-01-15T14:20:00Z',
      posts: 1234,
      topics: 89,
      reputation: 567,
      views: 15678,
      location: 'Россия',
      bio: 'Администратор сервера Arizona DRIP. Всегда готов помочь игрокам!',
      signature: 'С уважением, Администрация Arizona DRIP',
      stats: {
        totalPosts: 1234,
        totalTopics: 89,
        totalViews: 15678,
        reputation: 567,
        likes: 234
      },
      badges: [
        { name: 'Администратор', color: 'bg-red-500', icon: '👑' },
        { name: 'Ветеран', color: 'bg-purple-500', icon: '🏆' },
        { name: 'Помощник', color: 'bg-blue-500', icon: '🤝' }
      ],
      recentPosts: [
        {
          id: 1,
          title: 'Обновление сервера 2.5',
          category: 'Новости',
          date: '2024-01-15T10:30:00Z',
          replies: 45
        },
        {
          id: 2,
          title: 'Ответ на жалобу',
          category: 'Модерация',
          date: '2024-01-14T16:20:00Z',
          replies: 5
        }
      ]
    };

    setUser(mockUser);
  }, [id, currentUser]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'moderator': return 'text-green-400';
      case 'vip': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Обзор', icon: User },
    { id: 'posts', name: 'Сообщения', icon: MessageCircle },
    { id: 'activity', name: 'Активность', icon: Eye },
    { id: 'achievements', name: 'Достижения', icon: Award }
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="card p-0 overflow-hidden mb-8">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-purple-600 via-purple-500 to-cyan-500 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="p-6">
          <div className="flex items-end -mt-20 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900"></div>
            </div>

            <div className="ml-6 flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className={`text-3xl font-bold mb-2 ${getRoleColor(user.role)}`}>
                    {user.username}
                  </h1>
                  <p className="text-gray-300 mb-2">{user.bio}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Регистрация: {formatDate(user.joinDate)}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      Последняя активность: {formatDate(user.lastActivity)}
                    </span>
                    {user.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location}
                      </span>
                    )}
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Редактировать
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-6">
            {user.badges.map((badge, idx) => (
              <div key={idx} className={`px-3 py-1 ${badge.color} rounded-full flex items-center space-x-1`}>
                <span>{badge.icon}</span>
                <span className="text-white text-sm font-medium">{badge.name}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{user.stats.totalPosts}</div>
              <div className="text-sm text-gray-400">Сообщений</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{user.stats.totalTopics}</div>
              <div className="text-sm text-gray-400">Тем</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{user.stats.reputation}</div>
              <div className="text-sm text-gray-400">Репутация</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{user.stats.totalViews}</div>
              <div className="text-sm text-gray-400">Просмотров</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{user.stats.likes}</div>
              <div className="text-sm text-gray-400">Лайков</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-white/10">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-400 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">О пользователе</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-300">{user.email}</span>
                  </div>
                  {user.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {user.signature && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Подпись</h3>
                  <div className="p-4 bg-black/20 rounded-lg">
                    <p className="text-gray-300 italic">{user.signature}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Последние сообщения</h3>
              {user.recentPosts.map((post) => (
                <div key={post.id} className="p-4 bg-black/20 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-white mb-1">{post.title}</h4>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{formatDate(post.date)}</span>
                        <span>•</span>
                        <span>{post.replies} ответов</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">История активности</h3>
              <div className="text-gray-400">
                История активности пользователя будет отображаться здесь.
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Достижения</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {user.badges.map((badge, idx) => (
                  <div key={idx} className="p-4 bg-black/20 rounded-lg text-center">
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <div className="font-medium text-white">{badge.name}</div>
                    <div className="text-sm text-gray-400">Получено при регистрации</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;