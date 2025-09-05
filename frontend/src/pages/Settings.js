import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Save, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import config from '../config';

const Settings = ({ currentUser, onUpdate }) => {
  const navigate = useNavigate();
  
  console.log('🔍 Settings component received:', { 
    currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : null, 
    onUpdate: typeof onUpdate 
  });
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    signature: '',
    avatar_url: ''
  });
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        username: currentUser.username || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        signature: currentUser.signature || '',
        avatar_url: currentUser.avatar_url || ''
      });
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const updateProfile = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
        
        // Обновляем пользователя в App.js
        const updatedUser = { ...currentUser, ...formData };
        if (onUpdate) {
          onUpdate(updatedUser);
        }
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Ошибка обновления профиля' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'Новые пароли не совпадают' });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен быть не менее 6 символов' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${config.api.backendUrl}/api/users/${currentUser.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Пароль успешно изменен!' });
        setPasswords({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Ошибка смены пароля' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка сети' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    console.log('❌ Settings: No currentUser, redirecting to login');
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-2xl mx-auto">
          <div className="p-6">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost btn-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <SettingsIcon className="w-6 h-6" />
                  Настройки аккаунта
                </h2>
              </div>
            </div>
            
            {/* Отладочная информация */}
            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
              <strong>Отладка:</strong> Пользователь: {currentUser?.username} (ID: {currentUser?.id})
            </div>

            {/* Сообщения */}
            {message.text && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            {/* Настройки профиля */}
            <div className="space-y-6">
              <div className="border-b border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Основная информация
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Имя пользователя
                      </label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Введите имя пользователя"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-200 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm"
                        placeholder="Введите email"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      О себе
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm resize-none"
                      placeholder="Расскажите о себе..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      Подпись
                    </label>
                    <textarea
                      name="signature"
                      value={formData.signature}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm resize-none"
                      placeholder="Ваша подпись под сообщениями..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-200 mb-2">
                      URL аватара
                    </label>
                    <input
                      type="url"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm"
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <button
                  onClick={updateProfile}
                  disabled={isLoading}
                  className="btn btn-primary mt-4 flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="loading-spinner w-4 h-4"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Сохранить профиль
                </button>
              </div>

              {/* Смена пароля */}
              <div className="border-b border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Смена пароля
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Текущий пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm pr-10"
                        placeholder="Введите текущий пароль"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.current ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Новый пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm pr-10"
                        placeholder="Введите новый пароль"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.new ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Подтвердите новый пароль
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        className="w-full px-4 py-3 bg-black/30 border border-gray-500/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-200 backdrop-blur-sm pr-10"
                        placeholder="Повторите новый пароль"
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPasswords.confirm ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={changePassword}
                    disabled={isLoading}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    {isLoading ? (
                      <div className="loading-spinner w-4 h-4"></div>
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Сменить пароль
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
