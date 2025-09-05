import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Eye, Clock, Pin, Lock, Star, ChevronLeft, Plus } from 'lucide-react';
import config from '../config';

const CategoryView = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [user, setUser] = useState(null);
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const topicsPerPage = 20;

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // Извлекаем ID из формата category.1 или просто 1
        const categoryId = id.includes('.') ? id.split('.')[1] : id;
        
        const token = localStorage.getItem('token');
        
        // Загружаем информацию о пользователе
        if (token) {
          try {
            const userResponse = await fetch(`${config.api.backendUrl}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setUser(userData.user);
            }
          } catch (error) {
            console.error('Ошибка загрузки пользователя:', error);
          }
        }
        
        const response = await fetch(`${config.api.backendUrl}/api/categories/${categoryId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const categoryData = await response.json();
          setCategory(categoryData);
        } else {
          console.error('Ошибка загрузки категории:', response.statusText);
          // Fallback данные
          setCategory({
            id: categoryId,
            name: 'Категория не найдена',
            description: 'Категория не найдена или была удалена',
            totalTopics: 0,
            totalPosts: 0
          });
        }

        // Загружаем все категории для поиска подкатегорий
        const allCategoriesResponse = await fetch(`${config.api.backendUrl}/api/categories`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (allCategoriesResponse.ok) {
          const allCategories = await allCategoriesResponse.json();
          const categorySubcategories = allCategories.filter(cat => cat.parent_id === categoryId);
          setSubcategories(categorySubcategories);
        }

        // TODO: Загрузить темы из API
        setTopics([]);
      } catch (error) {
        console.error('Ошибка загрузки данных категории:', error);
        setCategory({
          id: id,
          name: 'Ошибка загрузки',
          description: 'Не удалось загрузить данные категории',
          totalTopics: 0,
          totalPosts: 0
        });
        setTopics([]);
      }
    };

    fetchCategoryData();
  }, [id]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400';
      case 'moderator': return 'text-green-400';
      case 'vip': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400';
      case 'moderator': return 'bg-green-500/20 text-green-400';
      case 'vip': return 'bg-yellow-500/20 text-yellow-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const sortedTopics = [...topics].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    switch (sortBy) {
      case 'latest':
        return new Date(b.lastPost.time) - new Date(a.lastPost.time);
      case 'replies':
        return b.replies - a.replies;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  const paginatedTopics = sortedTopics.slice(
    (currentPage - 1) * topicsPerPage,
    currentPage * topicsPerPage
  );

  const totalPages = Math.ceil(topics.length / topicsPerPage);

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-purple-400 transition-colors">Форум</Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-white">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{category.name}</h1>
            <p className="text-gray-300">{category.description}</p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex items-center space-x-3">
              <Link to={`/create-topic.${category.id}`} className="btn btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Создать тему
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-6 text-sm text-gray-400">
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {category.totalTopics} тем
          </span>
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {category.totalPosts} сообщений
          </span>
        </div>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Подкатегории</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategories.map((subcategory) => (
              <Link
                key={subcategory.id}
                to={`/category.${subcategory.id}`}
                className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{subcategory.icon || '📁'}</div>
                  <div>
                    <h3 className="font-semibold text-white">{subcategory.name}</h3>
                    <p className="text-sm text-gray-400">{subcategory.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <span className="text-gray-400 text-sm">Сортировать по:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white text-sm"
          >
            <option value="latest">Последним сообщениям</option>
            <option value="replies">Количеству ответов</option>
            <option value="views">Количеству просмотров</option>
          </select>
        </div>
      </div>

      {/* Topics List */}
      <div className="card p-0 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-800/50 text-sm text-gray-400 font-medium border-b border-white/10">
          <div className="col-span-6">Тема</div>
          <div className="col-span-2 text-center">Автор</div>
          <div className="col-span-1 text-center">Ответы</div>
          <div className="col-span-1 text-center">Просмотры</div>
          <div className="col-span-2 text-center">Последнее сообщение</div>
        </div>

        <div className="divide-y divide-white/10">
          {paginatedTopics.length > 0 ? paginatedTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topic.${topic.id}`}
              className="block p-4 hover:bg-white/5 transition-colors group"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Topic Title */}
                <div className="col-span-1 md:col-span-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex items-center space-x-1 mt-1">
                      {topic.isPinned && <Pin className="w-4 h-4 text-yellow-400" />}
                      {topic.isLocked && <Lock className="w-4 h-4 text-red-400" />}
                      {topic.hasUnread && <div className="w-2 h-2 bg-purple-400 rounded-full"></div>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold group-hover:text-purple-400 transition-colors ${
                        topic.hasUnread ? 'text-white' : 'text-gray-300'
                      }`}>
                        {topic.title}
                      </h3>
                      
                      {topic.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {topic.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Author */}
                <div className="col-span-1 md:col-span-2 md:text-center">
                  <div className="flex md:flex-col md:items-center items-start space-x-2 md:space-x-0">
                    <div className={`font-medium ${getRoleColor(topic.author.role)}`}>
                      {topic.author.username}
                    </div>
                    <span className={`badge text-xs ${getRoleBadge(topic.author.role)}`}>
                      {topic.author.role}
                    </span>
                  </div>
                </div>

                {/* Replies */}
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <div className="flex items-center md:justify-center">
                    <MessageCircle className="w-4 h-4 mr-1 text-gray-400 md:hidden" />
                    <span className="font-medium text-white">{topic.replies}</span>
                  </div>
                </div>

                {/* Views */}
                <div className="col-span-1 md:col-span-1 md:text-center">
                  <div className="flex items-center md:justify-center">
                    <Eye className="w-4 h-4 mr-1 text-gray-400 md:hidden" />
                    <span className="text-gray-400">{topic.views}</span>
                  </div>
                </div>

                {/* Last Post */}
                <div className="col-span-1 md:col-span-2 md:text-center">
                  <div className="text-sm">
                    <div className="text-gray-300">от {topic.lastPost.author}</div>
                    <div className="text-gray-400">{topic.lastPost.time}</div>
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-white mb-2">Нет тем</h3>
              <p className="text-gray-400 mb-6">
                В этой категории пока нет тем для обсуждения.
                {user?.role === 'admin' && (
                  <>
                    <br />
                    Вы можете создать первую тему.
                  </>
                )}
              </p>
              {user?.role === 'admin' && (
                <Link to={`/create-topic.${category.id}`} className="btn btn-primary flex items-center gap-2 mx-auto w-fit">
                  <Plus className="w-4 h-4" />
                  Создать первую тему
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="btn btn-ghost px-3 py-2 disabled:opacity-50"
          >
            Назад
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const page = i + Math.max(1, currentPage - 2);
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 rounded transition-colors ${
                  currentPage === page
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-ghost px-3 py-2 disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoryView;