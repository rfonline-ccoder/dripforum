import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RegisterPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    if (!agreedToTerms) {
      setError('Необходимо согласиться с правилами');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      const { user, token } = response.data;
      onLogin(user, token);
    } catch (error) {
      setError(error.response?.data?.message || 'Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Регистрация</h1>
            <p className="text-gray-300">Создайте аккаунт для участия в форуме</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Имя пользователя
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="form-input pl-12"
                  placeholder="Выберите имя пользователя"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">От 3 до 20 символов</p>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email адрес
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input pl-12"
                  placeholder="Введите email адрес"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input pl-12 pr-12"
                  placeholder="Создайте пароль"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Подтвердите пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input pl-12 pr-12"
                  placeholder="Повторите пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-300">
                Я согласен с{' '}
                <Link to="/terms" className="text-purple-400 hover:text-purple-300 transition-colors">
                  правилами форума
                </Link>{' '}
                и{' '}
                <Link to="/privacy" className="text-purple-400 hover:text-purple-300 transition-colors">
                  политикой конфиденциальности
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || !agreedToTerms}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner w-5 h-5 mr-2"></div>
                  Регистрация...
                </div>
              ) : (
                'Зарегистрироваться'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400">или</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-300">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Forum */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            ← Вернуться на форум
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;