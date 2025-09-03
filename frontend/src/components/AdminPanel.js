import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Shield, Users, MessageCircle, Settings, BarChart3, Flag, 
  Eye, Ban, UserCheck, Palette, Database, Globe, Mail,
  FileText, Zap, Activity, AlertTriangle, Lock, Plus,
  Edit, Trash2, Search, Filter, Download, Upload
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
    // Mock data
    const mockUsers = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      username: `User${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ['user', 'moderator', 'vip', 'admin'][Math.floor(Math.random() * 4)],
      status: Math.random() > 0.1 ? 'active' : 'banned',
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      posts: Math.floor(Math.random() * 1000),
      reputation: Math.floor(Math.random() * 500)
    }));
    setUsers(mockUsers);
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
              {filteredUsers.slice((currentPage - 1) * 20, currentPage * 20).map((user) => (
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
                    <span className={`badge ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Активен' : 'Забанен'}
                    </span>
                  </td>
                  <td>{new Date(user.joinDate).toLocaleDateString('ru-RU')}</td>
                  <td>{user.posts}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-400 hover:text-blue-300">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="text-yellow-400 hover:text-yellow-300">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-red-400 hover:text-red-300">
                        <Ban className="w-4 h-4" />
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

const AdminPanel = ({ user }) => {
  const location = useLocation();
  
  const adminMenuItems = [
    { path: '/admin', name: 'Панель управления', icon: BarChart3, exact: true },
    { path: '/admin/users', name: 'Пользователи', icon: Users },
    { path: '/admin/forum', name: 'Форум', icon: MessageCircle },
    { path: '/admin/reports', name: 'Жалобы', icon: Flag },
    { path: '/admin/settings', name: 'Настройки', icon: Settings },
    { path: '/admin/appearance', name: 'Внешний вид', icon: Palette },
    { path: '/admin/database', name: 'База данных', icon: Database },
    { path: '/admin/logs', name: 'Логи', icon: FileText }
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
            <Route path="/settings" element={<ForumSettings />} />
            <Route path="/*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;