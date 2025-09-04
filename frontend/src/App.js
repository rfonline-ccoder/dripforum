import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';

// Components
import Header from './components/Header';
import ForumMain from './components/ForumMain';
import TopicView from './components/TopicView';
import CategoryView from './components/CategoryView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import UserProfile from './components/UserProfile';
import Settings from './pages/Settings';
import AdminPanel from './components/AdminPanel';
import ModeratorPanel from './components/ModeratorPanel';

import config from './config';

// Настройка axios для обработки ошибок
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Автоматически удаляем токен при 401 ошибке
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

const BACKEND_URL = config.api.backendUrl;
const API = `${BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and get user info
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, skipping auth check');
        setIsLoading(false);
        return;
      }
      
      console.log('Checking auth with token:', token.substring(0, 20) + '...');
      
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Auth response:', response.data);
      
      // API возвращает { user: {...} }, поэтому берем response.data.user
      if (response.data && response.data.user) {
        console.log('Setting user:', response.data.user);
        setUser(response.data.user);
      } else {
        console.error('Invalid response format:', response.data);
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      if (error.response?.status === 401) {
        // Токен истек или недействителен
        console.log('Token expired or invalid, removing from localStorage');
        localStorage.removeItem('token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData, token) => {
    console.log('Login called with:', { userData, token: token ? token.substring(0, 20) + '...' : 'no token' });
    
    localStorage.setItem('token', token);
    // Убеждаемся, что userData содержит правильную структуру
    if (userData && typeof userData === 'object') {
      console.log('Setting user in state:', userData);
      setUser(userData);
    } else {
      console.error('Invalid user data:', userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Header user={user} onLogout={logout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ForumMain />} />
            <Route path="/category/:id" element={<CategoryView />} />
            <Route path="/topic/:id" element={<TopicView />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <LoginPage onLogin={login} />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" /> : <RegisterPage onLogin={login} />} 
            />
            <Route 
              path="/profile/:id?" 
              element={user ? <UserProfile currentUser={user} onUpdate={setUser} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/profile" 
              element={user ? <UserProfile currentUser={user} onUpdate={setUser} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/settings" 
              element={user ? <Settings /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/admin/*" 
              element={user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/moderator/*" 
              element={user?.role === 'admin' || user?.role === 'moderator' ? <ModeratorPanel user={user} /> : <Navigate to="/" />} 
            />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
}

export default App;