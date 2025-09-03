import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  Shield, Flag, Ban, UserCheck, Eye, MessageCircle, 
  AlertTriangle, Clock, CheckCircle, X, Search, 
  Filter, Trash2, Lock, Unlock, Pin, Zap
} from 'lucide-react';

const ModeratorDashboard = () => {
  const [stats, setStats] = useState({
    pendingReports: 12,
    resolvedToday: 8,
    bannedToday: 3,
    totalActions: 156
  });

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.pendingReports}</div>
              <div className="text-sm text-gray-400">Ожидающие жалобы</div>
            </div>
            <Flag className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.resolvedToday}</div>
              <div className="text-sm text-gray-400">Решено сегодня</div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.bannedToday}</div>
              <div className="text-sm text-gray-400">Забанено сегодня</div>
            </div>
            <Ban className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-white">{stats.totalActions}</div>
              <div className="text-sm text-gray-400">Всего действий</div>
            </div>
            <Zap className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Последние жалобы</h3>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div>
                  <div className="text-white font-medium">Жалоба на пользователя BadUser{i+1}</div>
                  <div className="text-sm text-gray-400">От: Reporter{i+1} • {i+1} часов назад</div>
                  <div className="text-sm text-yellow-400">Причина: Нарушение правил</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="btn btn-ghost btn-sm">Просмотреть</button>
                <button className="btn btn-primary btn-sm">Рассмотреть</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    // Mock data
    const mockReports = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      reporter: `Reporter${i + 1}`,
      reportedUser: `BadUser${i + 1}`,
      reportedContent: `Post${i + 1}`,
      reason: ['spam', 'harassment', 'inappropriate', 'cheating'][Math.floor(Math.random() * 4)],
      description: `Описание жалобы ${i + 1}. Пользователь нарушает правила форума.`,
      status: ['pending', 'resolved', 'rejected'][Math.floor(Math.random() * 3)],
      priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: Math.random() > 0.5 ? `Moderator${Math.floor(Math.random() * 3) + 1}` : null
    }));
    setReports(mockReports);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
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

  const filteredReports = reports.filter(report => {
    return filterStatus === 'all' || report.status === filterStatus;
  });

  return (
    <div className="space-y-6">
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
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>#{report.id}</td>
                  <td>{report.reporter}</td>
                  <td>
                    <span className="font-medium text-red-400">{report.reportedUser}</span>
                  </td>
                  <td>
                    <span className="capitalize">{report.reason}</span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusColor(report.status)}`}>
                      {report.status === 'pending' ? 'Ожидает' : 
                       report.status === 'resolved' ? 'Решена' : 'Отклонена'}
                    </span>
                  </td>
                  <td>{new Date(report.createdAt).toLocaleDateString('ru-RU')}</td>
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
                          <button className="text-green-400 hover:text-green-300" title="Принять">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="text-red-400 hover:text-red-300" title="Отклонить">
                            <X className="w-4 h-4" />
                          </button>
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
                    <div className="text-white font-medium">{selectedReport.reporter}</div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Нарушитель</label>
                    <div className="text-red-400 font-medium">{selectedReport.reportedUser}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Причина</label>
                  <div className="text-white">{selectedReport.reason}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Описание</label>
                  <div className="text-white p-3 bg-black/20 rounded-lg">
                    {selectedReport.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400">Приоритет</label>
                    <span className={`badge ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Статус</label>
                    <span className={`badge ${getStatusColor(selectedReport.status)}`}>
                      {selectedReport.status}
                    </span>
                  </div>
                </div>

                {selectedReport.status === 'pending' && (
                  <div className="flex space-x-4 pt-4">
                    <button className="btn btn-primary flex-1">Принять жалобу</button>
                    <button className="btn btn-secondary flex-1">Отклонить</button>
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

const UserActions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionType, setActionType] = useState('');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Действия с пользователями</h2>

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Быстрые действия</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Введите имя пользователя"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value)}
            className="form-input"
          >
            <option value="">Выберите действие</option>
            <option value="warn">Предупреждение</option>
            <option value="mute">Мут</option>
            <option value="ban">Бан</option>
            <option value="unban">Разбан</option>
          </select>
          <button className="btn btn-primary">Выполнить</button>
        </div>
      </div>

      {/* IP Check Tool */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Проверка IP</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Введите IP адрес или имя пользователя"
              className="form-input flex-1"
            />
            <button className="btn btn-secondary">Проверить</button>
          </div>
          <div className="p-4 bg-black/20 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">Результат проверки:</div>
            <div className="text-white">IP: 192.168.1.1 • Регион: Россия • ISP: Provider • Мультиаккаунты: 2</div>
          </div>
        </div>
      </div>

      {/* Ban Management */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Управление банами</h3>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Причина</th>
                <th>Модератор</th>
                <th>Дата бана</th>
                <th>Истекает</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td>BannedUser{i+1}</td>
                  <td>Читерство</td>
                  <td>Moderator1</td>
                  <td>{new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ru-RU')}</td>
                  <td>{i === 0 ? 'Навсегда' : '30 дней'}</td>
                  <td>
                    <button className="text-green-400 hover:text-green-300 mr-2">
                      <Unlock className="w-4 h-4" />
                    </button>
                    <button className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </button>
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

const ModeratorPanel = ({ user }) => {
  const location = useLocation();
  
  const moderatorMenuItems = [
    { path: '/moderator', name: 'Панель модератора', icon: Shield, exact: true },
    { path: '/moderator/reports', name: 'Жалобы', icon: Flag },
    { path: '/moderator/users', name: 'Действия с пользователями', icon: UserCheck },
    { path: '/moderator/content', name: 'Модерация контента', icon: MessageCircle }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-8 h-8 text-green-400" />
              <div>
                <h2 className="font-bold text-white">Модерация</h2>
                <p className="text-sm text-gray-400">Управление контентом</p>
              </div>
            </div>

            <nav className="space-y-2">
              {moderatorMenuItems.map((item) => {
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
                        ? 'bg-green-500/20 text-green-400'
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
            <Route path="/" element={<ModeratorDashboard />} />
            <Route path="/reports" element={<ReportsManagement />} />
            <Route path="/users" element={<UserActions />} />
            <Route path="/*" element={<Navigate to="/moderator" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ModeratorPanel;