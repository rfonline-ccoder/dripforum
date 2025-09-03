import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';

// Components
import Header from './components/Header';
import HomePage from './components/HomePage';
import ForumMain from './components/ForumMain';
import TopicView from './components/TopicView';
import CategoryView from './components/CategoryView';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import UserProfile from './components/UserProfile';
import AdminPanel from './components/AdminPanel';
import ModeratorPanel from './components/ModeratorPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
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
        setIsLoading(false);
        return;
      }
      
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
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
              element={user ? <UserProfile user={user} /> : <Navigate to="/login" />} 
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