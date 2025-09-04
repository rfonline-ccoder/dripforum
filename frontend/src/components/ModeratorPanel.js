import React, { useState, useEffect } from 'react';
import config from '../config';
import { Link, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Flag, 
  UserCheck, 
  MessageCircle, 
  Eye, 
  CheckCircle, 
  X, 
  Trash2,
  TrendingUp,
  Users,
  AlertTriangle,
  Clock
} from 'lucide-react';

// Компонент для управления жалобами
const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
          const response = await fetch(`${config.api.backendUrl}/api/reports`);
    if (response.ok) {
      const data = await response.json();
      setReports(data);
    } else {
        console.error('Ошибка загрузки жалоб');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const result = await response.json();
        setNotification({ type: 'success', message: result.message });
        setTimeout(() => setNotification(null), 3000);
        
        // Обновляем список жалоб
        fetchReports();
        
        // Закрываем модальное окно
        setSelectedReport(null);
      } else {
        const errorData = await response.json();
        setNotification({ type: 'error', message: errorData.error || 'Ошибка обновления статуса' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      setNotification({ type: 'error', message: 'Ошибка сети' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Управление жалобами</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
          >
            <option value="all">Все статусы</option>
            <option value="pending">Ожидающие</option>
            <option value="resolved">Решенные</option>
            <option value="rejected">Отклоненные</option>
          </select>
        </div>
      </div>

      {/* Уведомления */}
      {notification && (
        <div className={`alert ${notification.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {notification.message}
        </div>
      )}

      {/* Таблица жалоб */}
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
                  <td className="text-sm text-gray-400">#{report.id}</td>
                  <td>
                    <div className="text-white font-medium">{report.reporter_username}</div>
                  </td>
                  <td>
                    <div className="text-red-400 font-medium">{report.reported_username}</div>
                  </td>
                  <td>
                    <div className="max-w-xs truncate" title={report.reason}>
                      {report.reason}
                    </div>
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
                          <button 
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            className="text-green-400 hover:text-green-300" 
                            title="Принять"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateReportStatus(report.id, 'rejected')}
                            className="text-red-400 hover:text-red-300" 
                            title="Отклонить"
                          >
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

// Компонент для действий с пользователями
const UserActions = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Действия с пользователями</h2>
      <div className="card p-6">
        <p className="text-gray-400">Функционал в разработке...</p>
      </div>
    </div>
  );
};

// Компонент для модерации контента
const ContentModeration = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Модерация контента</h2>
      <div className="card p-6">
        <p className="text-gray-400">Функционал в разработке...</p>
      </div>
    </div>
  );
};

// Главная панель модератора
const ModeratorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.slice(0, 5)); // Показываем только первые 5 жалоб
      }
    } catch (error) {
      console.error('Ошибка загрузки жалоб:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
      case 'resolved': return 'bg-green-500/20 text-green-400 border-green-500/40';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/40';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Панель модератора</h2>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <Flag className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-sm text-gray-400">Ожидающие жалобы</p>
              <p className="text-2xl font-bold text-white">
                {reports.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Решенные жалобы</p>
              <p className="text-2xl font-bold text-white">
                {reports.filter(r => r.status === 'resolved').length}
              </p>
            </div>
          </div>
        </div>

      <div className="card p-6">
          <div className="flex items-center space-x-3">
            <X className="w-8 h-8 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Отклоненные жалобы</p>
              <p className="text-2xl font-bold text-white">
                {reports.filter(r => r.status === 'rejected').length}
              </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Всего жалоб</p>
              <p className="text-2xl font-bold text-white">{reports.length}</p>
          </div>
          </div>
        </div>
      </div>

      {/* Последние жалобы */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Последние жалобы</h3>
        <div className="space-y-4">
          {reports.map((report, i) => (
            <div key={report.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">
                    {report.reporter_username} → {report.reported_username}
                  </span>
                  <span className={`badge ${getStatusColor(report.status)}`}>
                    {report.status === 'pending' ? 'Ожидает' : 
                     report.status === 'resolved' ? 'Решена' : 'Отклонена'}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{report.reason}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`badge ${getStatusColor(report.status)}`}>
                  {report.status === 'pending' ? 'Ожидает' : 
                   report.status === 'resolved' ? 'Решена' : 'Отклонена'}
                </span>
                <button className="btn btn-ghost btn-sm">Просмотреть</button>
                <button 
                  onClick={() => {
                    // Здесь можно добавить логику для быстрого рассмотрения
                    console.log('Быстрое рассмотрение жалобы', i + 1);
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Рассмотреть
                    </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Быстрые действия */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary">Одобрить все ожидающие</button>
          <button className="btn btn-secondary">Отклонить все ожидающие</button>
          <button className="btn btn-ghost">Экспорт отчета</button>
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
            <Route path="/content" element={<ContentModeration />} />
            <Route path="/*" element={<Navigate to="/moderator" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ModeratorPanel;