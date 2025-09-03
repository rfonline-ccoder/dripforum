import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Eye, Clock, Pin, Lock, Star, ChevronLeft, Plus } from 'lucide-react';

const CategoryView = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const topicsPerPage = 20;

  useEffect(() => {
    // Mock data - replace with API call
    const mockCategory = {
      id: parseInt(id),
      name: 'Общение',
      description: 'Общие темы для обсуждения',
      totalTopics: 456,
      totalPosts: 7834
    };

    const mockTopics = Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      title: i === 0 ? 'Правила раздела - обязательно к прочтению!' : `Тема ${i + 1}: Обсуждение игровых механик`,
      author: {
        id: Math.floor(Math.random() * 1000) + 1,
        username: `User${Math.floor(Math.random() * 1000) + 1}`,
        avatar: null,
        role: i === 0 ? 'admin' : ['user', 'moderator', 'vip'][Math.floor(Math.random() * 3)]
      },
      replies: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 1000) + 100,
      lastPost: {
        author: `LastUser${Math.floor(Math.random() * 100) + 1}`,
        time: `${Math.floor(Math.random() * 60) + 1} минут назад`
      },
      isPinned: i === 0,
      isLocked: i === 2,
      hasUnread: Math.random() > 0.7,
      tags: i % 3 === 0 ? ['Важное'] : i % 5 === 0 ? ['Вопрос', 'Помощь'] : []
    }));

    setCategory(mockCategory);
    setTopics(mockTopics);
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
          <Link to={`/create-topic/${category.id}`} className="btn btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Создать тему
          </Link>
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
          {paginatedTopics.map((topic) => (
            <Link
              key={topic.id}
              to={`/topic/${topic.id}`}
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
          ))}
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