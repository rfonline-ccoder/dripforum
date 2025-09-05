import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ForumLogs from './ForumLogs';
import config from '../config';
import { 
  Shield, Users, MessageCircle, Settings, BarChart3, Flag, 
  Eye, Ban, UserCheck, Palette, Database, Globe, Mail,
  FileText, Zap, Activity, AlertTriangle, Lock, Plus,
  Edit, Trash2, Search, Filter, Download, Upload, X
} from 'lucide-react';

// Admin Panel Components
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 15234,
    totalPosts: 24931,
    totalReports: 45,
    bannedUsers: 12,
    newUsersToday: 23,
    postsToday: 156,
    reportsToday: 5,
    onlineUsers: 234
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Всего пользователей</div>
              <div className="text-xs text-green-400">+{stats.newUsersToday} сегодня</div>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalPosts.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Всего сообщений</div>
              <div className="text-xs text-green-400">+{stats.postsToday} сегодня</div>
            </div>
            <MessageCircle className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalReports}</div>
              <div className="text-sm text-gray-400">Активных жалоб</div>
              <div className="text-xs text-yellow-400">+{stats.reportsToday} сегодня</div>
            </div>
            <Flag className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.onlineUsers}</div>
              <div className="text-sm text-gray-400">Онлайн сейчас</div>
              <div className="text-xs text-green-400">Пик: 312</div>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Последние действия</h3>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-black/20 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm text-white">Пользователь User{i+1} создал новую тему</div>
                  <div className="text-xs text-gray-400">{i+1} минут назад</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Системные уведомления</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <div className="flex-1">
                <div className="text-sm text-white">Высокая нагрузка на сервер</div>
                <div className="text-xs text-gray-400">5 минут назад</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <Ban className="w-5 h-5 text-red-400" />
              <div className="flex-1">
                <div className="text-sm text-white">Забанен пользователь за читерство</div>
                <div className="text-xs text-gray-400">15 минут назад</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Загружаем реальных пользователей с сервера
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.api.backendUrl}/api/users`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          console.error('Ошибка загрузки пользователей');
        }
      } catch (error) {
        console.error('Ошибка:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'moderator': return 'bg-green-500/20 text-green-400';
      case 'vip': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  };

  // Функции для действий с пользователями
  const handleEditUser = (user) => {
    // TODO: Открыть модалку редактирования
    console.log('Редактировать пользователя:', user);
  };

  const handleViewUser = (user) => {
    // TODO: Открыть модалку просмотра
    console.log('Просмотреть пользователя:', user);
  };

  const handleBanUser = (user) => {
    // TODO: Открыть модалку бана
    console.log('Забанить пользователя:', user);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление пользователями</h2>
        <button className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Добавить пользователя
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени или email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-12"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="form-input"
          >
            <option value="all">Все роли</option>
            <option value="user">Пользователь</option>
            <option value="vip">VIP</option>
            <option value="moderator">Модератор</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Регистрация</th>
                <th>Посты</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? filteredUsers.slice((currentPage - 1) * 20, currentPage * 20).map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-white">{user.username}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(user.banned ? 'banned' : 'active')}`}>
                      {user.banned ? 'Забанен' : 'Активен'}
                    </span>
                  </td>
                  <td>{user.join_date ? new Date(user.join_date).toLocaleDateString('ru-RU') : 'Не указана'}</td>
                  <td>{user.posts}</td>
                  <td>
                    <button 
                      onClick={() => window.open(`/profile/${user.username}.${user.id}`, '_blank')}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                      title="Открыть профиль"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Профиль</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-400 py-8">
                    Пользователи не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ForumSettings = () => {
  const [settings, setSettings] = useState({
    siteName: 'Arizona DRIP Forum',
    siteDescription: 'Официальный форум сервера Arizona DRIP',
    allowRegistration: true,
    requireEmailConfirmation: true,
    postsPerPage: 20,
    topicsPerPage: 25,
    maxFileSize: 5,
    allowedFileTypes: 'jpg,png,gif,pdf,txt',
    maintenanceMode: false,
    enableNotifications: true
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Настройки форума</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Основные настройки</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Название сайта</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Описание сайта</label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                className="form-input h-20"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="allowRegistration"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
              />
              <label htmlFor="allowRegistration" className="text-white">Разрешить регистрацию</label>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="requireEmail"
                checked={settings.requireEmailConfirmation}
                onChange={(e) => setSettings({...settings, requireEmailConfirmation: e.target.checked})}
              />
              <label htmlFor="requireEmail" className="text-white">Требовать подтверждение email</label>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Настройки отображения</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Постов на странице</label>
              <input
                type="number"
                value={settings.postsPerPage}
                onChange={(e) => setSettings({...settings, postsPerPage: parseInt(e.target.value)})}
                className="form-input"
                min="10"
                max="50"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Тем на странице</label>
              <input
                type="number"
                value={settings.topicsPerPage}
                onChange={(e) => setSettings({...settings, topicsPerPage: parseInt(e.target.value)})}
                className="form-input"
                min="10"
                max="50"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Максимальный размер файла (МБ)</label>
              <input
                type="number"
                value={settings.maxFileSize}
                onChange={(e) => setSettings({...settings, maxFileSize: parseInt(e.target.value)})}
                className="form-input"
                min="1"
                max="100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Разрешенные типы файлов</label>
              <input
                type="text"
                value={settings.allowedFileTypes}
                onChange={(e) => setSettings({...settings, allowedFileTypes: e.target.value})}
                className="form-input"
                placeholder="jpg,png,gif,pdf"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn btn-primary">Сохранить настройки</button>
      </div>
    </div>
  );
};

const ForumManagement = () => {
  const [categories, setCategories] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', icon: '', parent_id: null, position: 0 });
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedCategoryForPermissions, setSelectedCategoryForPermissions] = useState(null);
  const [categoryPermissions, setCategoryPermissions] = useState({
    view_permissions: ['all'],
    create_topic_permissions: ['admin'],
    create_subcategory_permissions: ['admin'],
    post_permissions: ['all'],
    moderate_permissions: ['admin', 'moderator'],
    is_locked: false,
    is_hidden: false
  });

  // Загрузка категорий из БД
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.api.backendUrl}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Ошибка загрузки категорий');
        }
      } catch (error) {
        console.error('Ошибка:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (newCategory.name.trim()) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${config.api.backendUrl}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newCategory.name,
            description: newCategory.description,
            icon: newCategory.icon,
            parent_id: newCategory.parent_id,
            position: newCategory.position
          })
        });
        
        if (response.ok) {
          const createdCategory = await response.json();
          setCategories([...categories, createdCategory]);
          setNewCategory({ name: '', description: '', icon: '', parent_id: null, position: 0 });
          setIsAddingCategory(false);
        } else {
          console.error('Ошибка создания категории');
        }
      } catch (error) {
        console.error('Ошибка:', error);
      }
    }
  };

  const handleDeleteCategory = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedCategoryForPermissions) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/categories/${selectedCategoryForPermissions.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryPermissions)
      });

      if (response.ok) {
        // Обновляем категорию в списке
        setCategories(prev => prev.map(cat => 
          cat.id === selectedCategoryForPermissions.id 
            ? { ...cat, ...categoryPermissions }
            : cat
        ));
        setShowPermissionsModal(false);
        setSelectedCategoryForPermissions(null);
        alert('Права доступа обновлены');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка обновления прав доступа');
      }
    } catch (error) {
      console.error('Ошибка обновления прав доступа:', error);
      alert('Ошибка обновления прав доступа');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление форумом</h2>
        <button 
          onClick={() => setIsAddingCategory(!isAddingCategory)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAddingCategory ? 'Отмена' : 'Добавить категорию'}
        </button>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {newCategory.parent_id ? 'Новая подкатегория' : 'Новая категория'}
          </h3>
          {newCategory.parent_id && (
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">
                Создается подкатегория для: <strong>{categories.find(cat => cat.id === newCategory.parent_id)?.name}</strong>
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="form-input"
                placeholder="Название категории"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Описание</label>
              <input
                type="text"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="form-input"
                placeholder="Описание категории"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Иконка</label>
              <input
                type="text"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                className="form-input"
                placeholder="chat, message, folder, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Родительская категория</label>
              <select
                value={newCategory.parent_id || ''}
                onChange={(e) => setNewCategory({...newCategory, parent_id: e.target.value || null})}
                className="form-input"
              >
                <option value="">Главная категория</option>
                {categories.filter(cat => !cat.parent_id).map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Порядок</label>
              <input
                type="number"
                value={newCategory.position}
                onChange={(e) => setNewCategory({...newCategory, position: parseInt(e.target.value)})}
                className="form-input"
                min="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => setIsAddingCategory(false)}
              className="btn btn-secondary"
            >
              Отмена
            </button>
            <button 
              onClick={handleAddCategory}
              className="btn btn-primary"
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Порядок</th>
                <th>Название</th>
                <th>Описание</th>
                <th>Тем</th>
                <th>Сообщений</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {categories.sort((a, b) => a.position - b.position).map((category) => (
                <tr key={category.id} className="hover:bg-gray-700/30 cursor-pointer" onClick={() => window.open(`/category.${category.id}`, '_blank')}>
                  <td>{category.position}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      {category.icon && <span className="text-lg">{category.icon}</span>}
                      <div>
                        <div className="font-medium text-white">{category.name}</div>
                        {category.parent_id && (
                          <div className="text-xs text-gray-500">Подкатегория</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-400">{category.description}</td>
                  <td>{category.topics_count || 0}</td>
                  <td>{category.posts_count || 0}</td>
                  <td>
                    <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => window.open(`/category.${category.id}`, '_blank')}
                        className="text-green-400 hover:text-green-300" 
                        title="Открыть категорию"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setNewCategory({
                            name: '',
                            description: '',
                            icon: '📁',
                            parent_id: category.id,
                            position: 0
                          });
                          setIsAddingCategory(true);
                        }}
                        className="text-blue-400 hover:text-blue-300" 
                        title="Создать подкатегорию"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedCategoryForPermissions(category);
                          setShowPermissionsModal(true);
                        }}
                        className="text-yellow-400 hover:text-yellow-300" 
                        title="Настройки прав доступа"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-400 hover:text-red-300" 
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const DatabaseManagement = () => {
  const [backups, setBackups] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    // Пока что оставляем пустой массив, так как у нас нет резервных копий
    setBackups([]);
  }, []);

  const handleCreateBackup = () => {
    setIsCreatingBackup(true);
    setTimeout(() => {
      const newBackup = {
        id: Date.now(),
        name: `backup_${new Date().toISOString().split('T')[0]}.sql`,
        size: '45.0 MB',
        createdAt: new Date().toLocaleString('ru-RU'),
        status: 'completed'
      };
      setBackups([newBackup, ...backups]);
      setIsCreatingBackup(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление базой данных</h2>
        <button 
          onClick={handleCreateBackup}
          disabled={isCreatingBackup}
          className="btn btn-primary flex items-center gap-2"
        >
          {isCreatingBackup ? (
            <>
              <div className="loading-spinner w-4 h-4"></div>
              Создание...
            </>
          ) : (
            <>
              <Database className="w-4 h-4" />
              Создать резервную копию
            </>
          )}
        </button>
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">45.2 MB</div>
              <div className="text-sm text-gray-400">Размер БД</div>
            </div>
            <Database className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">3</div>
              <div className="text-sm text-gray-400">Резервных копий</div>
            </div>
            <Download className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">MySQL 8.0</div>
              <div className="text-sm text-gray-400">Версия БД</div>
            </div>
            <Globe className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-white">Резервные копии</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Размер</th>
                <th>Дата создания</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td className="font-mono text-sm">{backup.name}</td>
                  <td>{backup.size}</td>
                  <td>{backup.createdAt}</td>
                  <td>
                    <span className="badge badge-success">Готово</span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-400 hover:text-blue-300" title="Скачать">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300" title="Удалить">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const LogsManagement = () => {
  const [logs, setLogs] = useState([]);
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Пока что оставляем пустой массив, так как у нас нет логов
    setLogs([]);
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-500/20 text-red-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'info': return 'bg-blue-500/20 text-blue-400';
      case 'debug': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Просмотр логов</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по логам..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-12"
            />
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="form-input"
          >
            <option value="all">Все уровни</option>
            <option value="error">Ошибки</option>
            <option value="warning">Предупреждения</option>
            <option value="info">Информация</option>
            <option value="debug">Отладка</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Уровень</th>
                <th>Источник</th>
                <th>Сообщение</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-sm text-gray-400">{log.timestamp}</td>
                  <td>
                    <span className={`badge ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td>
                    <span className="text-purple-400 font-medium">{log.source}</span>
                  </td>
                  <td className="text-white">{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Экспорт логов</h3>
        <div className="flex items-center space-x-4">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Экспорт в CSV
          </button>
          <button className="btn btn-secondary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Экспорт в TXT
          </button>
          <button className="btn btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Очистить логи
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchReports();
    fetchModerators();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`${config.api.backendUrl}/api/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        console.error('Ошибка получения жалоб');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModerators = async () => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`${config.api.backendUrl}/api/reports/moderators/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModerators(data);
      }
    } catch (error) {
      console.error('Ошибка получения модераторов:', error);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`${config.api.backendUrl}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Обновляем локальное состояние
        setReports(reports.map(report => 
          report.id === reportId ? { ...report, status } : report
        ));
        
        // Показываем уведомление
        setNotification({ type: 'success', message: result.message });
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        setNotification({ type: 'error', message: errorData.error || 'Ошибка обновления статуса' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const assignModerator = async (reportId, moderatorId) => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(`${config.api.backendUrl}/api/reports/${reportId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ moderator_id: moderatorId })
      });
      
      if (response.ok) {
        const result = await response.json();
        // Обновляем локальное состояние
        setReports(reports.map(report => 
          report.id === reportId ? { ...report, assigned_moderator_id: moderatorId } : report
        ));
        
        // Показываем уведомление
        setNotification({ type: 'success', message: result.message });
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        setNotification({ type: 'error', message: errorData.error || 'Ошибка назначения модератора' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Ошибка:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'resolved': return 'badge-success';
      case 'rejected': return 'badge-error';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'resolved': return 'Решена';
      case 'rejected': return 'Отклонена';
      default: return status;
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return 'Критический';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const filteredReports = filterStatus === 'all' 
    ? reports 
    : reports.filter(report => report.status === filterStatus);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Уведомления */}
      {notification && (
        <div className={`p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/40 text-green-400' 
            : 'bg-red-500/20 border border-red-500/40 text-red-400'
        }`}>
          {notification.message}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление жалобами</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-input"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидающие</option>
            <option value="resolved">Решенные</option>
            <option value="rejected">Отклоненные</option>
          </select>

        </div>
      </div>

      {/* Reports Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Жалобщик</th>
                <th>Нарушитель</th>
                <th>Причина</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Назначен</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="font-mono text-sm">#{report.id}</td>
                  <td className="text-gray-300">{report.reporter_username}</td>
                  <td className="text-red-400 font-medium">{report.reported_username}</td>
                  <td className="text-gray-300">{report.reason}</td>
                  <td>
                    <span className={`badge ${getPriorityColor(report.priority)}`}>
                      {getPriorityText(report.priority)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(report.status)}`}>
                      {getStatusText(report.status)}
                    </span>
                  </td>
                  <td>
                    {report.assigned_moderator_id ? (
                      <span className="text-green-400">{report.moderator_username}</span>
                    ) : (
                      <span className="text-gray-400">Не назначен</span>
                    )}
                  </td>
                  <td className="text-sm text-gray-400">
                    {new Date(report.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Просмотреть"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {report.status === 'pending' && (
                        <>
                          <select
                            value={report.assigned_moderator_id || ''}
                            onChange={(e) => assignModerator(report.id, e.target.value)}
                            className="text-xs bg-transparent border border-gray-600 rounded px-2 py-1"
                          >
                            <option value="">Назначить</option>
                            {moderators.map(mod => (
                              <option key={mod.id} value={mod.id}>
                                {mod.username}
                              </option>
                            ))}
                          </select>
                          
                          <select
                            value={report.status}
                            onChange={(e) => updateReportStatus(report.id, e.target.value)}
                            className="text-xs bg-transparent border border-gray-600 rounded px-2 py-1"
                          >
                            <option value="pending">Ожидает</option>
                            <option value="resolved">Решена</option>
                            <option value="rejected">Отклонена</option>
                          </select>
                        </>
                      )}
                    </div>
                  </td>
                                  </tr>
              ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Жалоба #{selectedReport.id}</h3>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Жалобщик</label>
                    <div className="text-white font-medium">{selectedReport.reporter_username}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Нарушитель</label>
                    <div className="text-red-400 font-medium">{selectedReport.reported_username}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Причина</label>
                  <div className="text-white">{selectedReport.reason}</div>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className="text-sm text-gray-400">Описание</label>
                    <div className="text-white p-3 bg-black/20 rounded-lg">
                      {selectedReport.description}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Приоритет</label>
                    <span className={`badge ${getPriorityColor(selectedReport.priority)}`}>
                      {getPriorityText(selectedReport.priority)}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Статус</label>
                    <span className={`badge ${getStatusColor(selectedReport.status)}`}>
                      {getStatusText(selectedReport.status)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Дата создания</label>
                    <div className="text-white">
                      {new Date(selectedReport.created_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Последнее обновление</label>
                    <div className="text-white">
                      {new Date(selectedReport.updated_at).toLocaleString('ru-RU')}
                    </div>
                  </div>
                </div>

                {selectedReport.status === 'pending' && (
                  <div className="flex space-x-4 pt-4">
                    <button 
                      onClick={() => updateReportStatus(selectedReport.id, 'resolved')}
                      className="btn btn-primary flex-1"
                    >
                      Принять жалобу
                    </button>
                    <button 
                      onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                      className="btn btn-secondary flex-1"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppearanceManagement = () => {
  const [theme, setTheme] = useState('dark'); // 'light' or 'dark'
  const [customCSS, setCustomCSS] = useState('');
  const [logo, setLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      // In a real app, you'd send this to a backend
      console.log('Logo uploaded:', file.name);
    }
  };

  const handleFaviconUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFavicon(file);
      // In a real app, you'd send this to a backend
      console.log('Favicon uploaded:', file.name);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Настройки внешнего вида</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Настройки темы</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Тема</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="form-input"
              >
                <option value="light">Светлая</option>
                <option value="dark">Темная</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Пользовательский CSS</label>
              <textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                className="form-input h-20"
              />
            </div>
          </div>
        </div>

        {/* Site Assets */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ассеты сайта</h3>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Логотип</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="form-input"
              />
              {logo && (
                <div className="mt-2 text-sm text-gray-400">Выбран файл: {logo.name}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Иконка сайта (favicon)</label>
              <input
                type="file"
                accept="image/x-icon"
                onChange={handleFaviconUpload}
                className="form-input"
              />
              {favicon && (
                <div className="mt-2 text-sm text-gray-400">Выбран файл: {favicon.name}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="btn btn-primary">Сохранить настройки</button>
      </div>
    </div>
  );
};

const RulesManagement = () => {
  const [rules, setRules] = useState([]);
  const [categories, setCategories] = useState(['Общие', 'Общение', 'Контент', 'Безопасность', 'Технические']);
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    title: '',
    content: '',
    category: 'Общие',
    priority: 'medium',
    isActive: true
  });

  useEffect(() => {
    // Пока что оставляем пустой массив, так как у нас нет правил
    setRules([]);
  }, []);

  const handleAddRule = () => {
    if (newRule.title.trim() && newRule.content.trim()) {
      const rule = {
        id: Date.now(),
        ...newRule,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setRules([...rules, rule]);
      setNewRule({ title: '', content: '', category: 'Общие', priority: 'medium', isActive: true });
      setIsAddingRule(false);
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setNewRule({
      title: rule.title,
      content: rule.content,
      category: rule.category,
      priority: rule.priority,
      isActive: rule.isActive
    });
    setIsAddingRule(true);
  };

  const handleUpdateRule = () => {
    if (editingRule && newRule.title.trim() && newRule.content.trim()) {
      setRules(rules.map(rule => 
        rule.id === editingRule.id 
          ? { ...rule, ...newRule, updatedAt: new Date().toISOString().split('T')[0] }
          : rule
      ));
      setEditingRule(null);
      setNewRule({ title: '', content: '', category: 'Общие', priority: 'medium', isActive: true });
      setIsAddingRule(false);
    }
  };

  const handleDeleteRule = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить это правило?')) {
      setRules(rules.filter(rule => rule.id !== id));
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление правилами</h2>
        <button 
          onClick={() => setIsAddingRule(!isAddingRule)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAddingRule ? 'Отмена' : 'Добавить правило'}
        </button>
      </div>

      {/* Add/Edit Rule Form */}
      {isAddingRule && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingRule ? 'Редактировать правило' : 'Новое правило'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Название правила</label>
                <input
                  type="text"
                  value={newRule.title}
                  onChange={(e) => setNewRule({...newRule, title: e.target.value})}
                  className="form-input"
                  placeholder="Название правила"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Категория</label>
                <select
                  value={newRule.category}
                  onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                  className="form-input"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Приоритет</label>
                <select
                  value={newRule.priority}
                  onChange={(e) => setNewRule({...newRule, priority: e.target.value})}
                  className="form-input"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="critical">Критический</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Статус</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newRule.isActive}
                    onChange={(e) => setNewRule({...newRule, isActive: e.target.checked})}
                    className="form-checkbox"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-400">
                    Правило активно
                  </label>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Содержание правила</label>
              <textarea
                value={newRule.content}
                onChange={(e) => setNewRule({...newRule, content: e.target.value})}
                className="form-input h-32"
                placeholder="Подробное описание правила..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAddingRule(false);
                  setEditingRule(null);
                  setNewRule({ title: '', content: '', category: 'Общие', priority: 'medium', isActive: true });
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button 
                onClick={editingRule ? handleUpdateRule : handleAddRule}
                className="btn btn-primary"
              >
                {editingRule ? 'Обновить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Категория</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>
                    <div className="max-w-xs">
                      <div className="font-medium text-white">{rule.title}</div>
                      <div className="text-sm text-gray-400 line-clamp-2 mt-1">
                        {rule.content}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-purple-400">{rule.category}</span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityColor(rule.priority)}`}>
                      {rule.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${rule.isActive ? 'badge-success' : 'bg-gray-500/20 text-gray-400'}`}>
                      {rule.isActive ? 'Активно' : 'Неактивно'}
                    </span>
                  </td>
                  <td className="text-sm text-gray-400">
                    {rule.updatedAt}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditRule(rule)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Preview */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Предварительный просмотр правил</h3>
        <div className="space-y-4">
          {rules.filter(rule => rule.isActive).map((rule) => (
            <div key={rule.id} className="p-4 bg-black/20 rounded-lg border border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{rule.title}</h4>
                <span className={`badge ${getPriorityColor(rule.priority)}`}>
                  {rule.priority}
                </span>
              </div>
              <p className="text-gray-300 text-sm">{rule.content}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-400">Категория: {rule.category}</span>
                <span className="text-xs text-gray-400">Обновлено: {rule.updatedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UserGroupsManagement = () => {
  const [groups, setGroups] = useState([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    color: '#8b5cf6',
    permissions: [],
    isDefault: false
  });

  const availablePermissions = [
    { id: 'create_topics', name: 'Создание тем', description: 'Может создавать новые темы' },
    { id: 'create_posts', name: 'Создание постов', description: 'Может отвечать в темах' },
    { id: 'edit_own_posts', name: 'Редактирование своих постов', description: 'Может редактировать свои сообщения' },
    { id: 'delete_own_posts', name: 'Удаление своих постов', description: 'Может удалять свои сообщения' },
    { id: 'moderate_posts', name: 'Модерация постов', description: 'Может модерировать чужие посты' },
    { id: 'ban_users', name: 'Бан пользователей', description: 'Может банить других пользователей' },
    { id: 'manage_categories', name: 'Управление категориями', description: 'Может создавать и редактировать категории' },
    { id: 'view_logs', name: 'Просмотр логов', description: 'Может просматривать системные логи' },
    { id: 'admin_panel', name: 'Доступ к админке', description: 'Полный доступ к административной панели' }
  ];

  useEffect(() => {
    // Пока что оставляем пустой массив, так как у нас нет групп
    setGroups([]);
  }, []);

  const handleAddGroup = () => {
    if (newGroup.name.trim() && newGroup.description.trim()) {
      const group = {
        id: Date.now(),
        ...newGroup,
        userCount: 0,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setGroups([...groups, group]);
      setNewGroup({ name: '', description: '', color: '#8b5cf6', permissions: [], isDefault: false });
      setIsAddingGroup(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setNewGroup({
      name: group.name,
      description: group.description,
      color: group.color,
      permissions: [...group.permissions],
      isDefault: group.isDefault
    });
    setIsAddingGroup(true);
  };

  const handleUpdateGroup = () => {
    if (editingGroup && newGroup.name.trim() && newGroup.description.trim()) {
      setGroups(groups.map(group => 
        group.id === editingGroup.id 
          ? { ...group, ...newGroup }
          : group
      ));
      setEditingGroup(null);
      setNewGroup({ name: '', description: '', color: '#8b5cf6', permissions: [], isDefault: false });
      setIsAddingGroup(false);
    }
  };

  const handleDeleteGroup = (id) => {
    const group = groups.find(g => g.id === id);
    if (group.isDefault) {
      alert('Нельзя удалить группу по умолчанию!');
      return;
    }
    if (group.userCount > 0) {
      alert('Нельзя удалить группу с пользователями!');
      return;
    }
    if (window.confirm('Вы уверены, что хотите удалить эту группу?')) {
      setGroups(groups.filter(group => group.id !== id));
    }
  };

  const handlePermissionChange = (permissionId, checked) => {
    if (checked) {
      setNewGroup({...newGroup, permissions: [...newGroup.permissions, permissionId]});
    } else {
      setNewGroup({...newGroup, permissions: newGroup.permissions.filter(p => p !== permissionId)});
    }
  };

  const getPermissionName = (permissionId) => {
    const permission = availablePermissions.find(p => p.id === permissionId);
    return permission ? permission.name : permissionId;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление группами пользователей</h2>
        <button 
          onClick={() => setIsAddingGroup(!isAddingGroup)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {isAddingGroup ? 'Отмена' : 'Добавить группу'}
        </button>
      </div>

      {/* Add/Edit Group Form */}
      {isAddingGroup && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingGroup ? 'Редактировать группу' : 'Новая группа'}
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Название группы</label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  className="form-input"
                  placeholder="Название группы"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Цвет группы</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newGroup.color}
                    onChange={(e) => setNewGroup({...newGroup, color: e.target.value})}
                    className="w-12 h-10 rounded border border-gray-600"
                  />
                  <input
                    type="text"
                    value={newGroup.color}
                    onChange={(e) => setNewGroup({...newGroup, color: e.target.value})}
                    className="form-input flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Описание</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                className="form-input h-20"
                placeholder="Описание группы и её назначения..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Права доступа</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3 p-3 bg-black/20 rounded-lg">
                    <input
                      type="checkbox"
                      id={permission.id}
                      checked={newGroup.permissions.includes(permission.id)}
                      onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                      className="form-checkbox mt-1"
                    />
                    <div>
                      <label htmlFor={permission.id} className="text-sm font-medium text-white cursor-pointer">
                        {permission.name}
                      </label>
                      <p className="text-xs text-gray-400 mt-1">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newGroup.isDefault}
                  onChange={(e) => setNewGroup({...newGroup, isDefault: e.target.checked})}
                  className="form-checkbox"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-400">
                  Группа по умолчанию для новых пользователей
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAddingGroup(false);
                  setEditingGroup(null);
                  setNewGroup({ name: '', description: '', color: '#8b5cf6', permissions: [], isDefault: false });
                }}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button 
                onClick={editingGroup ? handleUpdateGroup : handleAddGroup}
                className="btn btn-primary"
              >
                {editingGroup ? 'Обновить' : 'Добавить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Группа</th>
                <th>Описание</th>
                <th>Права</th>
                <th>Пользователей</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: group.color }}
                      ></div>
                      <div>
                        <div className="font-medium text-white">{group.name}</div>
                        <div className="text-xs text-gray-400">ID: {group.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <div className="text-sm text-gray-300">{group.description}</div>
                    </div>
                  </td>
                  <td>
                    <div className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {group.permissions.slice(0, 3).map(permission => (
                          <span key={permission} className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {getPermissionName(permission)}
                          </span>
                        ))}
                        {group.permissions.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{group.permissions.length - 3} еще
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium text-white">{group.userCount}</span>
                  </td>
                  <td>
                    <span className={`badge ${group.isDefault ? 'badge-success' : 'bg-gray-500/20 text-gray-400'}`}>
                      {group.isDefault ? 'По умолчанию' : 'Пользовательская'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEditGroup(group)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Удалить"
                        disabled={group.isDefault || group.userCount > 0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Summary */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Сводка по правам доступа</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availablePermissions.map((permission) => {
            const groupsWithPermission = groups.filter(group => 
              group.permissions.includes(permission.id)
            );
            return (
              <div key={permission.id} className="p-4 bg-black/20 rounded-lg border border-gray-600">
                <h4 className="font-medium text-white mb-2">{permission.name}</h4>
                <p className="text-sm text-gray-400 mb-3">{permission.description}</p>
                <div className="text-xs text-gray-500">
                  Группы с этим правом: {groupsWithPermission.length}
                </div>
                {groupsWithPermission.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {groupsWithPermission.map(group => (
                      <span 
                        key={group.id}
                        className="text-xs px-2 py-1 rounded"
                        style={{ 
                          backgroundColor: group.color + '20',
                          color: group.color
                        }}
                      >
                        {group.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ user }) => {
  const location = useLocation();
  
  const adminMenuItems = [
    { path: '/admin', name: 'Панель управления', icon: BarChart3, exact: true },
    { path: '/admin/users', name: 'Пользователи', icon: Users },
    { path: '/admin/forum', name: 'Форум', icon: MessageCircle },
    { path: '/admin/reports', name: 'Жалобы', icon: Flag },
    { path: '/admin/rules', name: 'Правила', icon: FileText },
    { path: '/admin/usergroups', name: 'Группы пользователей', icon: UserCheck },
    { path: '/admin/settings', name: 'Настройки', icon: Settings },
    { path: '/admin/appearance', name: 'Внешний вид', icon: Palette },
    { path: '/admin/database', name: 'База данных', icon: Database },
    { path: '/admin/logs', name: 'Логи', icon: FileText },
    { path: '/admin/forum-logs', name: 'Логи форума', icon: Activity }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-red-400" />
              <div>
                <h2 className="font-bold text-white">Админ-панель</h2>
                <p className="text-sm text-gray-400">Управление сайтом</p>
              </div>
            </div>

            <nav className="space-y-2">
              {adminMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact 
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/forum" element={<ForumManagement />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="/rules" element={<RulesManagement />} />
            <Route path="/usergroups" element={<UserGroupsManagement />} />
              <Route path="/settings" element={<ForumSettings />} />
              <Route path="/appearance" element={<AppearanceManagement />} />
              <Route path="/database" element={<DatabaseManagement />} />
              <Route path="/logs" element={<LogsManagement />} />
              <Route path="/forum-logs" element={<ForumLogs />} />
              <Route path="/*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;