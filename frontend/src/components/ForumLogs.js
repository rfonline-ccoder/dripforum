import React, { useState, useEffect, useCallback } from 'react';
import config from '../config';
import { 
  FileText, 
  Search, 
  Filter, 
  Trash2, 
  BarChart3, 
  Download,
  RefreshCw
} from 'lucide-react';

const ForumLogs = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${config.api.backendUrl}/api/logs/forum?limit=${limit}&offset=${offset}&filter=${filter}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setHasMore(data.hasMore);
      } else {
        console.error('Ошибка загрузки логов');
      }
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit, offset, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/logs/forum/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (showStats) {
      fetchStats();
    }
  }, [showStats, fetchStats]);

  const cleanOldLogs = async () => {
    if (!window.confirm('Вы уверены, что хотите очистить логи старше 30 дней?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/logs/forum/clean`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ daysToKeep: 30 })
      });
      
      if (response.ok) {
        alert('Старые логи очищены');
        fetchLogs();
      }
    } catch (error) {
      console.error('Ошибка очистки логов:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  const getActionColor = (action) => {
    const colors = {
      'LOGIN': 'text-blue-400',
      'LOGOUT': 'text-gray-400',
      'POST_CREATE': 'text-green-400',
      'POST_EDIT': 'text-yellow-400',
      'POST_DELETE': 'text-red-400',
      'USER_BANNED': 'text-red-500',
      'USER_MUTED': 'text-orange-500',
      'PROFILE_UPDATE': 'text-purple-400',
      'REPORT_CREATE': 'text-pink-400',
      'REPORT_RESOLVE': 'text-green-500'
    };
    return colors[action] || 'text-gray-400';
  };

  const exportLogs = () => {
    if (!logs || logs.length === 0) {
      alert('Нет логов для экспорта');
      return;
    }
    
    const csvContent = [
      'Timestamp,Action,Username,UserID,IP,Details',
      ...logs.map(log => 
        `${log.timestamp},${log.action},${log.username},${log.userId},${log.ip || ''},"${log.details ? JSON.stringify(log.details) : ''}"`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forum_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Логи форума</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowStats(!showStats)}
            className="btn btn-secondary"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            {showStats ? 'Скрыть статистику' : 'Показать статистику'}
          </button>
          <button
            onClick={cleanOldLogs}
            className="btn btn-warning"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить старые
          </button>
          <button
            onClick={exportLogs}
            className="btn btn-ghost"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Статистика */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Общая статистика</h3>
            <div className="text-3xl font-bold text-blue-400">{stats.totalLogs}</div>
            <div className="text-sm text-gray-400">Всего записей</div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Топ пользователей</h3>
            <div className="space-y-2">
              {stats.topUsers.slice(0, 5).map((user, index) => (
                <div key={user.username} className="flex justify-between">
                  <span className="text-white">{user.username}</span>
                  <span className="text-blue-400">{user.count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Топ действий</h3>
            <div className="space-y-2">
              {stats.topActions.slice(0, 5).map((action, index) => (
                <div key={action.action} className="flex justify-between">
                  <span className="text-white">{action.action}</span>
                  <span className="text-green-400">{action.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Фильтры */}
      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по логам..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input pl-10 w-full"
              />
            </div>
          </div>
          <button
            onClick={() => {
              setFilter('');
              setOffset(0);
            }}
            className="btn btn-ghost"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Сброс
          </button>
        </div>
      </div>

      {/* Логи */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Время</th>
                    <th>Действие</th>
                    <th>Пользователь</th>
                    <th>IP адрес</th>
                    <th>Детали</th>
                  </tr>
                </thead>
                <tbody>
                  {logs && logs.length > 0 ? logs.map((log, index) => (
                    <tr key={index}>
                      <td className="text-sm text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td>
                        <span className={`badge ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">
                            {log.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            (ID: {log.userId})
                          </span>
                        </div>
                      </td>
                      <td className="text-sm text-gray-400">
                        {log.ip || 'N/A'}
                      </td>
                      <td>
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-400 hover:text-blue-300">
                              Показать детали
                            </summary>
                            <pre className="text-xs text-gray-300 mt-2 p-2 bg-black/20 rounded overflow-auto max-w-xs">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-500">Нет</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-400 py-8">
                        Логи не найдены
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Пагинация */}
            {logs.length > 0 && (
              <div className="p-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Показано {offset + 1}-{offset + logs.length} из {stats?.totalLogs || '?'} записей
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="btn btn-ghost btn-sm disabled:opacity-50"
                    >
                      Назад
                    </button>
                    <button
                      onClick={() => setOffset(offset + limit)}
                      disabled={!hasMore}
                      className="btn btn-ghost btn-sm disabled:opacity-50"
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ForumLogs;
