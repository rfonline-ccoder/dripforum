import React, { useState, useEffect, useCallback } from 'react';
import config from '../config';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  User, 
  Calendar, 
  MessageCircle, 
  Shield, 
  Ban, 
  AlertTriangle,
  Trophy,
  VolumeX,
  Settings as SettingsIcon
} from 'lucide-react';

const UserProfile = ({ userId, currentUser, onUpdate }) => {
  const { userId: urlUserId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showModeratorActions, setShowModeratorActions] = useState(false);
  const [showGroupChange, setShowGroupChange] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedAchievements, setSelectedAchievements] = useState([]);

  const actualUserId = userId || urlUserId || currentUser?.id;
  
  console.log('🔍 UserProfile props:', {
    userId,
    urlUserId,
    actualUserId,
    currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : null
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Debug UserProfile:', {
        actualUserId,
        token: token ? token.substring(0, 20) + '...' : 'NO TOKEN',
        url: `${config.api.backendUrl}/api/users/${actualUserId}`
      });
      
      const response = await fetch(`${config.api.backendUrl}/api/users/${actualUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📡 Response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User data:', userData);
        
        // Загружаем достижения пользователя
        try {
          const achievementsResponse = await fetch(`${config.api.backendUrl}/api/achievements/user/${actualUserId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (achievementsResponse.ok) {
            const achievementsData = await achievementsResponse.json();
            userData.achievements = achievementsData;
            console.log('🏆 Achievements loaded:', achievementsData);
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки достижений:', error);
        }

        // Загружаем комментарии в профиле
        try {
          const commentsResponse = await fetch(`${config.api.backendUrl}/api/profile-comments/${actualUserId}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            userData.profile_comments = commentsData;
            console.log('💬 Comments loaded:', commentsData);
          }
        } catch (error) {
          console.error('❌ Ошибка загрузки комментариев:', error);
        }
        
        setUser(userData);
        
        // Показываем админские действия если текущий пользователь админ
        if (currentUser && currentUser.role === 'admin') {
          setShowAdminActions(true);
        }
        
        // Показываем модераторские действия если текущий пользователь модератор
        if (currentUser && currentUser.role === 'moderator') {
          setShowModeratorActions(true);
        }
      } else {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        setError(`Ошибка API: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки профиля:', error);
      setError('Ошибка загрузки профиля. Проверьте подключение к серверу.');
    } finally {
      setIsLoading(false);
    }
  }, [actualUserId, currentUser]);

  useEffect(() => {
    if (actualUserId) {
      fetchUserProfile();
    }
  }, [actualUserId, fetchUserProfile]);

  // Загружаем группы пользователей
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.api.backendUrl}/api/usergroups`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const groupsData = await response.json();
          setGroups(groupsData);
        }
      } catch (error) {
        console.error('Ошибка загрузки групп:', error);
      }
    };

    // Загружаем достижения
    const fetchAchievements = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.api.backendUrl}/api/achievements`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const achievementsData = await response.json();
          setAchievements(achievementsData);
        }
      } catch (error) {
        console.error('Ошибка загрузки достижений:', error);
      }
    };

    if (showAdminActions) {
      fetchGroups();
      fetchAchievements();
    }
  }, [showAdminActions]);



  const handleGroupChange = async (selectedGroups) => {
    try {
      const token = localStorage.getItem('token');
      
      // Обновляем группу пользователя
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/change-group`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ groupId: selectedGroups[0] })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }
      
      // Обновляем пользователя
      const updatedUser = { ...user, group_id: selectedGroups[0] };
      setUser(updatedUser);
      setShowGroupChange(false);
      
      alert('Группа пользователя успешно обновлена!');
    } catch (error) {
      console.error('Ошибка смены групп:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleBan = async (reason, duration, durationType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason, duration, duration_type: durationType })
      });

      if (response.ok) {
        const updatedUser = { ...user, is_banned: true };
        setUser(updatedUser);
        setShowBanModal(false);
        alert('Пользователь заблокирован!');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка бана:', error);
      alert('Ошибка сети');
    }
  };

  const handleMute = async (reason, duration, durationType) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason, duration, duration_type: durationType })
      });

      if (response.ok) {
        const updatedUser = { ...user, is_muted: true };
        setUser(updatedUser);
        setShowMuteModal(false);
        alert('Пользователь замолчан!');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error}`);
      }
    } catch (error) {
      console.error('Ошибка мута:', error);
      alert('Ошибка сети');
    }
  };

  const handleGiveAchievement = async (selectedAchievements) => {
    try {
      const token = localStorage.getItem('token');
      
      // Выдаем достижения пользователю
      for (const achievementId of selectedAchievements) {
        const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/give-achievement`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ achievementId })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }
      }
      
      // Обновляем пользователя
      const updatedUser = { ...user, achievements: [...(user.achievements || []), ...achievements.filter(a => selectedAchievements.includes(a.id))] };
      setUser(updatedUser);
      setShowAchievementModal(false);
      
      alert('Достижения успешно выданы!');
    } catch (error) {
      console.error('Ошибка выдачи достижений:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleAddComment = async () => {
    try {
      const commentText = document.getElementById('profileComment').value.trim();
      if (!commentText) {
        alert('Введите текст комментария');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/profile-comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: commentText })
      });

      if (response.ok) {
        document.getElementById('profileComment').value = '';
        alert('Комментарий добавлен!');
        // Обновляем профиль
        fetchUserProfile();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Удалить этот комментарий?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/profile-comment/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Комментарий удален!');
        // Обновляем профиль
        fetchUserProfile();
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="card p-6 max-w-md">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ошибка загрузки</h3>
            <p className="text-red-400 mb-4">{error}</p>
            <div className="space-y-2">
              <button onClick={() => window.location.reload()} className="btn btn-primary w-full">
                Обновить страницу
              </button>
              <button onClick={() => navigate('/')} className="btn btn-secondary w-full">
                На главную
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <div className="card p-6 max-w-md">
          <p className="text-red-400">Пользователь не найден</p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">На главную</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="card max-w-4xl mx-auto">
            <div className="p-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Профиль пользователя</h2>
              <div className="flex items-center gap-2">
                {/* Кнопка настроек для своего профиля */}
                {currentUser && currentUser.id === actualUserId && (
                  <button
                    onClick={() => navigate('/settings')}
                    className="btn btn-secondary btn-sm flex items-center gap-2"
                    title="Настройки аккаунта"
                  >
                    <SettingsIcon className="w-4 h-4" />
                    Настройки
                  </button>
                )}
                <button 
                  onClick={() => navigate('/')}
                  className="btn btn-outline btn-sm"
                >
                  На главную
                </button>
              </div>
            </div>

                        {/* Основная информация */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Левая колонка - основная информация */}
              <div className="lg:col-span-2 space-y-6">
                {/* Аватар и имя */}
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${user.group_name ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {user.group_name || 'Пользователь'}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">ID: {user.id}</span>
                    </div>
                    {/* Достижения рядом с именем */}
                    {user.achievements && Array.isArray(user.achievements) && user.achievements.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        {user.achievements.slice(0, 5).map((achievement, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer"
                            title={`${achievement.name} - ${achievement.description}`}
                          >
                            <span 
                              className="text-xl transition-transform hover:scale-110"
                              style={{ color: achievement.color || '#ffffff' }}
                            >
                              {achievement.icon || '🏆'}
                            </span>
                            {/* Tooltip при наведении */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                              <div className="font-semibold">{achievement.name}</div>
                              <div className="text-gray-300">{achievement.description}</div>
                              {achievement.awarded_at && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Получено: {new Date(achievement.awarded_at).toLocaleDateString('ru-RU')}
                                </div>
                              )}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                            </div>
                          </div>
                        ))}
                        {user.achievements.length > 5 && (
                          <span className="text-sm text-gray-400">+{user.achievements.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              {/* Статистика */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">{user.posts_count || 0}</div>
              <div className="text-sm text-gray-400">Сообщений</div>
            </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">{user.reputation || 0}</div>
              <div className="text-sm text-gray-400">Репутация</div>
            </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">{user.achievements?.length || 0}</div>
                  <div className="text-sm text-gray-400">Достижений</div>
            </div>
                <div className="text-center p-4 bg-black/20 rounded-lg">
                  <div className="text-2xl font-bold text-white">{new Date(user.created_at).getFullYear()}</div>
                  <div className="text-sm text-gray-400">Год регистрации</div>
        </div>
      </div>

              {/* Дополнительная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <Calendar className="w-5 h-5 text-blue-400 mr-2" />
                    Информация
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-white">{user.email}</span>
        </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Дата регистрации:</span>
                      <span className="text-white">{new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                    {user.last_login && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Последний вход:</span>
                        <span className="text-white">{new Date(user.last_login).toLocaleDateString('ru-RU')}</span>
                    </div>
                  )}
                </div>
              </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                    <MessageCircle className="w-5 h-5 text-green-400 mr-2" />
                    Активность
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Статус:</span>
                      <span className={`badge ${user.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {user.is_banned ? 'Забанен' : 'Активен'}
                      </span>
                  </div>
                    {user.is_muted && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Мут:</span>
                        <span className="text-yellow-400">До {new Date(user.mute_expires).toLocaleDateString('ru-RU')}</span>
                </div>
              )}
                  </div>
                </div>
              </div>

              {/* Био и подпись */}
              {user.bio && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">О себе</h4>
                  <p className="text-gray-300 bg-black/20 p-3 rounded-lg">{user.bio}</p>
            </div>
          )}

              {user.signature && (
                    <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Подпись</h4>
                  <p className="text-gray-300 bg-black/20 p-3 rounded-lg italic">{user.signature}</p>
            </div>
          )}

                            {/* Достижения */}
              {user.achievements && Array.isArray(user.achievements) && user.achievements.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Достижения</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.achievements.map((achievement, index) => (
                      <span 
                        key={index}
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: (achievement.color || '#ffffff') + '20',
                          color: achievement.color || '#ffffff'
                        }}
                      >
                        {achievement.icon || '🏆'} {achievement.name || 'Достижение'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Комментарии в профиле */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  Комментарии в профиле
                </h4>
                
                {/* Форма добавления комментария */}
                {currentUser && (
                  <div className="mb-4 p-4 bg-black/20 rounded-lg">
                    <textarea
                      id="profileComment"
                      rows="3"
                      className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white placeholder-gray-400 resize-none"
                      placeholder="Оставьте комментарий в профиле этого пользователя..."
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleAddComment()}
                        className="btn btn-primary btn-sm"
                      >
                        Оставить комментарий
                      </button>
                    </div>
                  </div>
                )}

                {/* Список комментариев */}
                <div className="space-y-3">
                  {user.profile_comments && user.profile_comments.length > 0 ? (
                    user.profile_comments.map((comment, index) => (
                      <div key={index} className="p-3 bg-black/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{comment.author_username}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ru-RU')}
                            </span>
                          </div>
                          {currentUser && (currentUser.id === comment.author_id || currentUser.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <p className="text-gray-300">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">Пока нет комментариев</p>
                  )}
                </div>
              </div>
            </div>

            {/* Правая колонка - админские действия */}
            <div className="lg:col-span-1">
              {/* Админские действия */}
              {showAdminActions && (
                <div className="sticky top-6">
                  <div className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Shield className="w-5 h-5 text-red-400 mr-2" />
                      Админ действия
                    </h4>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowBanModal(true)}
                        className="btn btn-danger btn-sm w-full"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Бан
                      </button>
                      <button 
                        onClick={() => setShowMuteModal(true)}
                        className="btn btn-warning btn-sm w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Мут
                      </button>
                      <button 
                        onClick={() => setShowGroupChange(true)}
                        className="btn btn-primary btn-sm w-full"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Изменить группу
                      </button>
                      <button 
                        onClick={() => setShowAchievementModal(true)}
                        className="btn btn-success btn-sm w-full"
                      >
                        <Trophy className="w-4 h-4 mr-2" />
                        Достижения
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Модераторские действия */}
              {showModeratorActions && !showAdminActions && (
                <div className="sticky top-6">
                  <div className="bg-black/20 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Shield className="w-5 h-5 text-green-400 mr-2" />
                      Модератор действия
                    </h4>
                    <div className="space-y-3">
                      <button 
                        onClick={() => setShowBanModal(true)}
                        className="btn btn-danger btn-sm w-full"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Бан
                      </button>
                      <button 
                        onClick={() => setShowMuteModal(true)}
                        className="btn btn-warning btn-sm w-full"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Мут
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Модальное окно смены группы */}
      {showGroupChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Выбрать группу пользователя</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group.id]);
                        } else {
                          setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{group.name}</div>
                      <div className="text-sm text-gray-400">Группа пользователя</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => handleGroupChange(selectedGroups)}
                  className="btn btn-primary flex-1"
                  disabled={selectedGroups.length === 0}
                >
                  Применить
                </button>
                <button
                  onClick={() => setShowGroupChange(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно бана */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Заблокировать пользователя</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Причина</label>
                  <input
                    type="text"
                    id="banReason"
                    className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white placeholder-gray-400"
                    placeholder="Укажите причину блокировки"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Длительность</label>
                    <input
                      type="number"
                      id="banDuration"
                      className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Тип</label>
                    <select
                      id="banDurationType"
                      className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white"
                    >
                      <option value="hours">Часы</option>
                      <option value="days">Дни</option>
                      <option value="months">Месяцы</option>
                      <option value="permanent">Навсегда</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    const reason = document.getElementById('banReason').value;
                    const duration = document.getElementById('banDuration').value;
                    const durationType = document.getElementById('banDurationType').value;
                    if (reason && duration) {
                      handleBan(reason, parseInt(duration), durationType);
                    } else {
                      alert('Заполните все поля');
                    }
                  }}
                  className="btn btn-danger flex-1"
                >
                  Заблокировать
                </button>
                <button
                  onClick={() => setShowBanModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно мута */}
      {showMuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Замолчать пользователя</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Причина</label>
                  <input
                    type="text"
                    id="muteReason"
                    className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white placeholder-gray-400"
                    placeholder="Укажите причину мута"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Длительность</label>
                    <input
                      type="number"
                      id="muteDuration"
                      className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white"
                      placeholder="1"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Тип</label>
                    <select
                      id="muteDurationType"
                      className="w-full px-3 py-2 bg-black/30 border border-gray-500/50 rounded-lg text-white"
                    >
                      <option value="hours">Часы</option>
                      <option value="days">Дни</option>
                      <option value="months">Месяцы</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => {
                    const reason = document.getElementById('muteReason').value;
                    const duration = document.getElementById('muteDuration').value;
                    const durationType = document.getElementById('muteDurationType').value;
                    if (reason && duration) {
                      handleMute(reason, parseInt(duration), durationType);
                    } else {
                      alert('Заполните все поля');
                    }
                  }}
                  className="btn btn-warning flex-1"
                >
                  Замолчать
                </button>
                <button
                  onClick={() => setShowMuteModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно достижений */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Выдать достижения</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {achievements.map((achievement) => (
                  <label key={achievement.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAchievements.includes(achievement.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAchievements([...selectedAchievements, achievement.id]);
                        } else {
                          setSelectedAchievements(selectedAchievements.filter(id => id !== achievement.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white flex items-center gap-2">
                        <span>{achievement.icon}</span>
                        {achievement.name}
                      </div>
                      <div className="text-sm text-gray-400">{achievement.description}</div>
                      <div className="text-xs text-blue-400">🎯</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={() => handleGiveAchievement(selectedAchievements)}
                  className="btn btn-success flex-1"
                  disabled={selectedAchievements.length === 0}
                >
                  Выдать
                </button>
                <button
                  onClick={() => setShowAchievementModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;