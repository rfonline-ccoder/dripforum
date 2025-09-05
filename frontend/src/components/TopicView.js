import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MessageCircle, Eye, Clock, ChevronLeft, Reply, Quote, Flag, Edit, Trash2, Pin, Lock } from 'lucide-react';

const TopicView = () => {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [replyText, setReplyText] = useState('');
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const postsPerPage = 10;

  useEffect(() => {
    const fetchTopicData = async () => {
      try {
        // Извлекаем ID из формата topic.1 или просто 1
        const topicId = id.includes('.') ? id.split('.')[1] : id;
        
        // TODO: Загрузить данные темы из API
        const mockTopic = {
          id: topicId,
          title: 'Обсуждение нового обновления сервера',
          categoryId: 1,
          categoryName: 'Общение',
          author: {
            id: 1,
            username: 'AdminUser',
            role: 'admin',
            avatar: null,
            joinDate: '2023-01-15',
            posts: 1234,
            reputation: 567
          },
          createdAt: '2024-01-15T10:30:00Z',
          views: 1256,
          replies: 45,
          isPinned: true,
          isLocked: false,
          tags: ['Важное', 'Обновления']
        };

    const mockPosts = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      content: i === 0 
        ? 'Приветствую всех! Сегодня мы выпустили крупное обновление сервера. В этом обновлении:\n\n• Новые локации для исследования\n• Улучшенная система взаимодействия\n• Исправления багов\n• Оптимизация производительности\n\nОставляйте ваши отзывы и предложения!'
        : `Сообщение ${i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      author: {
        id: i + 1,
        username: i === 0 ? 'AdminUser' : `User${i + 1}`,
        role: i === 0 ? 'admin' : ['user', 'moderator', 'vip'][Math.floor(Math.random() * 3)],
        avatar: null,
        joinDate: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`,
        posts: Math.floor(Math.random() * 1000) + 50,
        reputation: Math.floor(Math.random() * 500)
      },
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
      editedAt: Math.random() > 0.8 ? new Date(Date.now() - Math.random() * 86400000 * 10).toISOString() : null,
      likes: Math.floor(Math.random() * 20),
      isLiked: Math.random() > 0.7
    }));

        setTopic(mockTopic);
        setPosts(mockPosts);
      } catch (error) {
        console.error('Ошибка загрузки данных темы:', error);
        setTopic({
          id: id,
          title: 'Ошибка загрузки',
          categoryId: 1,
          categoryName: 'Ошибка',
          author: {
            id: 1,
            username: 'Система',
            role: 'admin',
            avatar: null,
            joinDate: '2023-01-01',
            posts: 0,
            reputation: 0
          },
          createdAt: new Date().toISOString(),
          views: 0,
          replies: 0,
          isPinned: false,
          isLocked: false,
          tags: []
        });
        setPosts([]);
      }
    };

    fetchTopicData();
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const paginatedPosts = posts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const totalPages = Math.ceil(posts.length / postsPerPage);

  if (!topic) {
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
        <Link to={`/category.${topic.categoryId}`} className="hover:text-purple-400 transition-colors">
          {topic.categoryName}
        </Link>
        <ChevronLeft className="w-4 h-4 rotate-180" />
        <span className="text-white truncate">{topic.title}</span>
      </nav>

      {/* Topic Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {topic.isPinned && <Pin className="w-5 h-5 text-yellow-400" />}
              {topic.isLocked && <Lock className="w-5 h-5 text-red-400" />}
              <h1 className="text-2xl md:text-3xl font-bold text-white">{topic.title}</h1>
            </div>
            
            {topic.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {topic.tags.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {topic.views} просмотров
              </span>
              <span className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                {topic.replies} ответов
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDate(topic.createdAt)}
              </span>
            </div>
          </div>
          
          {!topic.isLocked && (
            <button
              onClick={() => setIsReplyOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Reply className="w-4 h-4" />
              Ответить
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-6">
        {paginatedPosts.map((post, index) => (
          <div key={post.id} className="card p-0 overflow-hidden">
            <div className="flex">
              {/* User Info Sidebar */}
              <div className="w-48 bg-black/20 p-4 border-r border-white/10 hidden md:block">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold text-lg">
                      {post.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className={`font-semibold mb-1 ${getRoleColor(post.author.role)}`}>
                    {post.author.username}
                  </h3>
                  
                  <span className={`badge text-xs mb-3 ${getRoleBadge(post.author.role)}`}>
                    {post.author.role}
                  </span>
                  
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>Регистрация: {formatDate(post.author.joinDate)}</div>
                    <div>Сообщений: {post.author.posts}</div>
                    <div>Репутация: {post.author.reputation}</div>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="flex-1 p-4">
                {/* Mobile User Info */}
                <div className="flex items-center space-x-3 mb-4 md:hidden">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {post.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className={`font-semibold ${getRoleColor(post.author.role)}`}>
                      {post.author.username}
                    </div>
                    <div className="text-xs text-gray-400">{formatDate(post.createdAt)}</div>
                  </div>
                </div>

                {/* Post Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-400">
                    #{(currentPage - 1) * postsPerPage + index + 1} • {formatDate(post.createdAt)}
                    {post.editedAt && (
                      <span className="ml-2 text-yellow-400">
                        (отредактировано {formatDate(post.editedAt)})
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-purple-400 transition-colors">
                      <Quote className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                      <Flag className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-blue-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-gray-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Post Content */}
                <div className="prose prose-invert max-w-none mb-4">
                  <p className="text-gray-300 whitespace-pre-line">{post.content}</p>
                </div>

                {/* Post Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-4">
                    <button className={`flex items-center space-x-1 text-sm transition-colors ${
                      post.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                    }`}>
                      <span>❤️</span>
                      <span>{post.likes}</span>
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <span>Поделиться</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
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

      {/* Quick Reply */}
      {!topic.isLocked && (
        <div className="card p-6 mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Быстрый ответ</h3>
          <div className="space-y-4">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Введите ваш ответ..."
              className="w-full h-32 p-4 bg-black/20 border border-white/10 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:border-purple-400"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Осталось символов: {1000 - replyText.length}
              </div>
              <button
                onClick={() => {
                  // Handle reply submission
                  console.log('Reply:', replyText);
                  setReplyText('');
                }}
                disabled={!replyText.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                Отправить ответ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicView;