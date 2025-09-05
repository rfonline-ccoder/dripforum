import React, { useState, useEffect, useCallback, useRef } from 'react';
import config from '../config';
import { useParams, useNavigate } from 'react-router-dom';

import { 
  User, 
  Calendar, 
  MessageCircle, 
  Shield, 
  Ban, 
  AlertTriangle,
  Trophy,
  VolumeX,
  Settings as SettingsIcon,
  Trash2,
  Eye,
  Award,
  Mail,
  MapPin,
  Edit3,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Smile,
  List,
  AlignLeft,
  Code,
  Quote,
  Save,
  Undo,
  Redo,
  Type,
  Palette,
  Strikethrough,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';

const UserProfile = ({ userId, currentUser, onUpdate }) => {
  const { usernameAndId: urlUsernameAndId } = useParams();
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  // Вспомогательная функция для безопасного парсинга CSS стилей
  const parseCssStyles = (cssStyles) => {
    if (!cssStyles) return {};
    
    // Если это уже объект, возвращаем как есть
    if (typeof cssStyles === 'object') {
      return cssStyles;
    }
    
    // Если это строка, пытаемся парсить как JSON
    if (typeof cssStyles === 'string') {
      try {
        return JSON.parse(cssStyles);
      } catch (e) {
        console.warn('Invalid CSS styles JSON:', cssStyles);
        return {};
      }
    }
    
    return {};
  };
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdminActions, setShowAdminActions] = useState(false);
  const [showModeratorActions, setShowModeratorActions] = useState(false);
  const [showGroupChange, setShowGroupChange] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showMuteModal, setShowMuteModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showIpModal, setShowIpModal] = useState(false);
  const [showAccountsModal, setShowAccountsModal] = useState(false);
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [showUnmuteModal, setShowUnmuteModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState('14px');
  const [userIp, setUserIp] = useState(null);
  const [relatedAccounts, setRelatedAccounts] = useState([]);
  const [userAchievements, setUserAchievements] = useState([]);
  const [deletingComment, setDeletingComment] = useState(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({});
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // Новые состояния для расширенной админской панели
  const [showAdminShieldModal, setShowAdminShieldModal] = useState(false);
  const [showEnhancedGroupModal, setShowEnhancedGroupModal] = useState(false);
  const [showEnhancedAchievementsModal, setShowEnhancedAchievementsModal] = useState(false);
  const [showEnhancedBanModal, setShowEnhancedBanModal] = useState(false);
  const [showEnhancedMuteModal, setShowEnhancedMuteModal] = useState(false);
  
  // Состояния для управления группами
  const [userGroups, setUserGroups] = useState([]);
  const [selectedGroupsToAdd, setSelectedGroupsToAdd] = useState([]);
  const [selectedGroupsToRemove, setSelectedGroupsToRemove] = useState([]);
  
  // Состояния для управления достижениями
  const [selectedAchievementsToAdd, setSelectedAchievementsToAdd] = useState([]);
  const [selectedAchievementsToRemove, setSelectedAchievementsToRemove] = useState([]);
  
  // Состояния для бана и мута с временем
  const [banDuration, setBanDuration] = useState('');
  const [banDurationType, setBanDurationType] = useState('hours'); // hours, days, forever
  const [banReason, setBanReason] = useState('');
  const [muteDuration, setMuteDuration] = useState('');
  const [muteDurationType, setMuteDurationType] = useState('hours'); // hours, days, forever
  const [muteReason, setMuteReason] = useState('');

  // Функция для получения числового ID из UUID
  const getNumericId = (uuid) => {
    if (!uuid) return '0';
    const hex = uuid.replace(/-/g, '').substring(0, 8);
    return parseInt(hex, 16).toString();
  };

  // Функция для определения позиции tooltip'а
  const getTooltipPosition = (achievementId, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const tooltipHeight = 80; // Примерная высота tooltip'а
    
    // Если иконка в верхней части экрана, показываем tooltip снизу
    const showBelow = rect.top < tooltipHeight + 20;
    
    setTooltipPosition(prev => ({
      ...prev,
      [achievementId]: showBelow ? 'bottom' : 'top'
    }));
  };

  // Функция для парсинга markdown и отображения форматированного текста
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    // Экранируем HTML для безопасности
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    let html = escapeHtml(text);
    
    // Жирный текст **text** или __text__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Курсив *text* или _text_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Зачеркивание ~~text~~
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Код `code`
    html = html.replace(/`(.*?)`/g, '<code class="bg-gray-600 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Цитаты > text
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-gray-400">$1</blockquote>');
    
    // Ссылки [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>');
    
    // Спойлеры ||text||
    html = html.replace(/\|\|(.*?)\|\|/g, '<span class="bg-gray-600 text-gray-600 hover:text-gray-300 cursor-pointer transition-colors px-1 rounded" title="Нажмите чтобы показать">$1</span>');
    
    // HTML теги для размера шрифта
    html = html.replace(/<small>([^<]+)<\/small>/g, '<span class="text-sm">$1</span>');
    html = html.replace(/<big>([^<]+)<\/big>/g, '<span class="text-lg">$1</span>');
    html = html.replace(/<h1>([^<]+)<\/h1>/g, '<span class="text-2xl font-bold">$1</span>');
    
    // Переносы строк
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  // Функции форматирования текста
  const insertFormatting = (format) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commentText.substring(start, end);
    let newText = '';

    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        break;
      case 'underline':
        newText = `__${selectedText}__`;
        break;
      case 'strikethrough':
        newText = `~~${selectedText}~~`;
        break;
      case 'code':
        newText = `\`${selectedText}\``;
        break;
      case 'quote':
        newText = `> ${selectedText}`;
        break;
      case 'link':
        if (selectedText) {
          // Если есть выделенный текст, открываем модалку для создания ссылки
          setLinkText(selectedText);
          setLinkUrl('');
          setShowLinkModal(true);
          return;
        } else {
          // Если нет выделенного текста, открываем модалку для ввода текста и ссылки
          setLinkText('');
          setLinkUrl('');
          setShowLinkModal(true);
          return;
        }
      case 'spoiler':
        newText = `||${selectedText}||`;
        break;
      case 'fontSize':
        // Обрабатывается отдельно
        return;
      default:
        newText = selectedText;
    }

    const newCommentText = commentText.substring(0, start) + newText + commentText.substring(end);
    setCommentText(newCommentText);
    
    // Устанавливаем курсор после вставленного текста
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  // Функция для вставки ссылки
  const insertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) return;
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commentText.substring(start, end);
    
    // Если есть выделенный текст, заменяем его на ссылку
    // Если нет, вставляем ссылку в текущую позицию
    const linkMarkdown = `[${linkText.trim()}](${linkUrl.trim()})`;
    const newCommentText = commentText.substring(0, start) + linkMarkdown + commentText.substring(end);
    
    setCommentText(newCommentText);
    setShowLinkModal(false);
    setLinkText('');
    setLinkUrl('');
    
    // Устанавливаем курсор после вставленной ссылки
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + linkMarkdown.length, start + linkMarkdown.length);
    }, 0);
  };

  // Функция для изменения размера шрифта
  const insertFontSize = (size) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = commentText.substring(start, end);
    
    if (!selectedText) return;
    
    let sizeTag = '';
    switch (size) {
      case 'small':
        sizeTag = '<small>';
        break;
      case 'large':
        sizeTag = '<big>';
        break;
      case 'huge':
        sizeTag = '<h1>';
        break;
      default:
        return;
    }
    
    const newText = `${sizeTag}${selectedText}${sizeTag.replace('<', '</')}`;
    const newCommentText = commentText.substring(0, start) + newText + commentText.substring(end);
    
    setCommentText(newCommentText);
    
    // Устанавливаем курсор после вставленного текста
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + newText.length, start + newText.length);
    }, 0);
  };

  // Загрузка пользователя
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let targetUserId = userId;
      
      if (urlUsernameAndId) {
        const [username, numericId] = urlUsernameAndId.split('.');
        if (username && numericId) {
          try {
            const response = await fetch(`${config.api.backendUrl}/api/users/username/${username}`, {
        headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
      
      if (response.ok) {
        const userData = await response.json();
              targetUserId = userData.id;
            }
          } catch (err) {
            console.error('Error fetching user by username:', err);
          }
        }
      }

      if (!targetUserId) {
        setError('Пользователь не найден');
        return;
      }

      const response = await fetch(`${config.api.backendUrl}/api/users/${targetUserId}`, {
            headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        loadComments(userData.id);
      } else {
        setError('Пользователь не найден');
      }
    } catch (err) {
      setError('Ошибка загрузки пользователя');
      console.error('Error loading user:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, urlUsernameAndId]);

  // Загрузка комментариев
  const loadComments = async (userId) => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/profile-comments/${userId}`, {
            headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  // Отправка комментария
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    try {
      const response = await fetch(`${config.api.backendUrl}/api/profile-comments/${user.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          text: commentText
        })
      });

      if (response.ok) {
        setCommentText('');
        loadComments(user.id);
      } else {
        console.error('Failed to submit comment');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  // Загрузка групп
  const loadGroups = async () => {
    try {
        const response = await fetch(`${config.api.backendUrl}/api/usergroups`, {
          headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const groupsData = await response.json();
          setGroups(groupsData);
        }
    } catch (err) {
      console.error('Error loading groups:', err);
      }
    };

  // Загрузка достижений
  const loadAchievements = async () => {
      try {
        const response = await fetch(`${config.api.backendUrl}/api/achievements`, {
          headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const achievementsData = await response.json();
          setAchievements(achievementsData);
        }
    } catch (err) {
      console.error('Error loading achievements:', err);
    }
  };

  // Смена группы пользователя
  const handleGroupChange = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/group`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          usergroup: selectedGroups[0]
        })
      });

      if (response.ok) {
      setShowGroupChange(false);
        setSelectedGroups([]);
        loadUser();
      }
    } catch (err) {
      console.error('Error changing group:', err);
    }
  };

  // Бан пользователя
  const handleBanUser = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Нарушение правил форума'
        })
      });

      if (response.ok) {
        setShowBanModal(false);
        loadUser();
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  // Мут пользователя
  const handleMuteUser = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Нарушение правил форума'
        })
      });

      if (response.ok) {
        setShowMuteModal(false);
        loadUser();
      }
    } catch (err) {
      console.error('Error muting user:', err);
    }
  };

  // Добавление достижений
  const handleAddAchievements = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/achievements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          achievement_ids: selectedAchievements
        })
      });

      if (response.ok) {
        setShowAchievementModal(false);
        setSelectedAchievements([]);
        loadUser();
      }
    } catch (err) {
      console.error('Error adding achievements:', err);
    }
  };

  // Получение IP пользователя
  const loadUserIp = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/ip`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const ipData = await response.json();
        setUserIp(ipData.ip);
      }
    } catch (err) {
      console.error('Error loading user IP:', err);
    }
  };

  // Получение связанных аккаунтов
  const loadRelatedAccounts = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/related-accounts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const accountsData = await response.json();
        setRelatedAccounts(accountsData);
      }
    } catch (err) {
      console.error('Error loading related accounts:', err);
    }
  };

  // Загрузка групп пользователя
  const loadUserGroups = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/groups`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const groupsData = await response.json();
        setUserGroups(groupsData);
      }
    } catch (err) {
      console.error('Error loading user groups:', err);
    }
  }, [user?.id]);

  // Управление группами пользователя
  const handleManageUserGroups = async () => {
    try {
      // Добавление групп
      if (selectedGroupsToAdd.length > 0) {
        await fetch(`${config.api.backendUrl}/api/users/${user.id}/groups`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            group_ids: selectedGroupsToAdd
          })
        });
      }

      // Удаление групп
      if (selectedGroupsToRemove.length > 0) {
        await fetch(`${config.api.backendUrl}/api/users/${user.id}/groups`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            group_ids: selectedGroupsToRemove
          })
        });
      }

      setShowEnhancedGroupModal(false);
      setSelectedGroupsToAdd([]);
      setSelectedGroupsToRemove([]);
      loadUserGroups();
      loadUser();
    } catch (err) {
      console.error('Error managing user groups:', err);
    }
  };

  // Управление достижениями пользователя
  const handleManageUserAchievements = async () => {
    try {
      // Добавление достижений
      if (selectedAchievementsToAdd.length > 0) {
        await fetch(`${config.api.backendUrl}/api/users/${user.id}/achievements`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            achievement_ids: selectedAchievementsToAdd
          })
        });
      }

      // Удаление достижений
      if (selectedAchievementsToRemove.length > 0) {
        await fetch(`${config.api.backendUrl}/api/users/${user.id}/achievements`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            achievement_ids: selectedAchievementsToRemove
          })
        });
      }

      setShowEnhancedAchievementsModal(false);
      setSelectedAchievementsToAdd([]);
      setSelectedAchievementsToRemove([]);
      loadUserAchievements();
      loadUser();
    } catch (err) {
      console.error('Error managing user achievements:', err);
    }
  };

  // Бан пользователя с временем
  const handleEnhancedBanUser = async () => {
    try {
      let expiresAt = null;
      
      if (banDurationType !== 'forever' && banDuration) {
        const duration = parseInt(banDuration);
        const now = new Date();
        
        if (banDurationType === 'hours') {
          expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
        } else if (banDurationType === 'days') {
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        }
      }

      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: banReason || 'Нарушение правил форума',
          expires_at: expiresAt
        })
      });

      if (response.ok) {
        setShowEnhancedBanModal(false);
        setBanDuration('');
        setBanReason('');
        setBanDurationType('hours');
        loadUser();
      }
    } catch (err) {
      console.error('Error banning user:', err);
    }
  };

  // Мут пользователя с временем
  const handleEnhancedMuteUser = async () => {
    try {
      let expiresAt = null;
      
      if (muteDurationType !== 'forever' && muteDuration) {
        const duration = parseInt(muteDuration);
        const now = new Date();
        
        if (muteDurationType === 'hours') {
          expiresAt = new Date(now.getTime() + duration * 60 * 60 * 1000);
        } else if (muteDurationType === 'days') {
          expiresAt = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        }
      }

      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/mute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: muteReason || 'Нарушение правил форума',
          expires_at: expiresAt
        })
      });

      if (response.ok) {
        setShowEnhancedMuteModal(false);
        setMuteDuration('');
        setMuteReason('');
        setMuteDurationType('hours');
        loadUser();
      }
    } catch (err) {
      console.error('Error muting user:', err);
    }
  };

  // Получение достижений пользователя
  const loadUserAchievements = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${config.api.backendUrl}/api/achievements/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const achievementsData = await response.json();
        console.log('Загружены достижения:', achievementsData);
        console.log('Детали достижений:', achievementsData.map(a => ({
          id: a.id,
          name: a.name,
          icon: a.icon,
          color: a.color,
          description: a.description
        })));
        setUserAchievements(achievementsData);
      } else {
        console.log('Ошибка загрузки достижений:', response.status);
        setUserAchievements([]);
      }
    } catch (err) {
      console.error('Error loading user achievements:', err);
      setUserAchievements([]);
    }
  }, [user?.id]);

  // Разбан пользователя
  const handleUnbanUser = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowUnbanModal(false);
        loadUser();
      }
    } catch (err) {
      console.error('Error unbanning user:', err);
    }
  };

  // Размут пользователя
  const handleUnmuteUser = async () => {
    try {
      const response = await fetch(`${config.api.backendUrl}/api/users/${user.id}/unmute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setShowUnmuteModal(false);
        loadUser();
      }
    } catch (err) {
      console.error('Error unmuting user:', err);
    }
  };

  // Показать модальное окно подтверждения удаления комментария
  const showDeleteCommentConfirmation = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
  };

  // Удалить комментарий
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      setDeletingComment(commentToDelete);
      const response = await fetch(`${config.api.backendUrl}/api/profile-comments/${user.id}/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        loadComments(user.id);
        setShowDeleteCommentModal(false);
        setCommentToDelete(null);
      } else {
        console.error('Ошибка удаления комментария');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
    } finally {
      setDeletingComment(null);
    }
  };

  useEffect(() => {
    loadUser();
    loadGroups();
    loadAchievements();
  }, [loadUser]);

  useEffect(() => {
    if (user && user.id) {
      loadComments(user.id);
      loadUserAchievements();
      loadUserGroups();
    }
  }, [user, loadUserAchievements, loadUserGroups]);

  // Обновляем модераторские права при изменении текущего пользователя
  useEffect(() => {
    const isModerator = currentUser?.usergroup === 'moderator';
    const isAdmin = currentUser?.usergroup === 'admin';
    
    setShowModeratorActions(isModerator || isAdmin);
    
    // Автоматически показываем админскую панель для админов
    if (isAdmin) {
      setShowAdminActions(true);
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Пользователь не найден</div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className={`${showAdminActions ? 'grid grid-cols-1 lg:grid-cols-3 gap-8' : 'max-w-6xl mx-auto'}`}>
          
          {/* Основной контент профиля */}
          <div className={`${showAdminActions ? 'lg:col-span-2' : 'w-full'} space-y-8`}>
            
            {/* Заголовок профиля */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  <User className="w-12 h-12" />
                  </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                    
                    {/* Достижения справа от имени пользователя */}
                    {userAchievements.length > 0 && (
                      <div className="flex items-center space-x-2 flex-wrap">
                        {userAchievements.map((achievement) => {
                          const position = tooltipPosition[achievement.id] || 'top';
                          const isTop = position === 'top';
                          
                          return (
                            <div
                              key={achievement.id}
                              className="relative group"
                            >
                              <div 
                                className="text-2xl cursor-pointer transition-transform hover:scale-110"
                                onMouseEnter={(e) => getTooltipPosition(achievement.id, e)}
                                onClick={() => {
                                  console.log('Достижение кликнуто:', {
                                    id: achievement.id,
                                    name: achievement.name,
                                    icon: achievement.icon,
                                    color: achievement.color
                                  });
                                }}
                              >
                                {achievement.icon || '🏆'}
                              </div>
                              
                              {/* Tooltip всегда снизу */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                <div className="font-semibold">{achievement.name}</div>
                                <div className="text-gray-300 text-xs">{achievement.description}</div>
                                <div className="text-gray-400 text-xs mt-1">
                                  Получено: {new Date(achievement.awarded_at).toLocaleDateString()}
                                </div>
                                
                                {/* Стрелка вверх */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Кнопка админской панели для админов */}
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => setShowAdminShieldModal(true)}
                        className="p-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        title="Админская панель"
                      >
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">Админ</span>
                      </button>
                    )}
                  </div>
                  
                  {/* Группы пользователя на месте ID */}
                  {(userGroups.length > 0 || user.group_name) && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-gray-400 text-sm">Группы:</span>
                      {/* Показываем группы из API */}
                      {userGroups.map((group) => (
                        <span
                          key={group.id}
                          className="px-3 py-1 text-sm rounded-full text-white shadow-md"
                          style={{ 
                            backgroundColor: group.color || '#6366f1',
                            ...parseCssStyles(group.css_styles)
                          }}
                        >
                          {group.name}
                        </span>
                      ))}
                      {/* Показываем основную группу пользователя, если нет групп из API */}
                      {userGroups.length === 0 && user.group_name && (
                        <span
                          className="px-3 py-1 text-sm rounded-full text-white shadow-md"
                          style={{ 
                            backgroundColor: user.group_color || '#6366f1',
                            ...parseCssStyles(user.css_styles)
                          }}
                        >
                          {user.group_name}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Роли пользователя */}
                  <div className="flex items-center space-x-4 mt-4">
                    {user.usergroup === 'admin' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-full flex items-center space-x-2 shadow-lg">
                        <Shield className="w-4 h-4" />
                        <span>Администратор</span>
                      </span>
                    )}
                    {user.usergroup === 'moderator' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white text-sm rounded-full flex items-center space-x-2 shadow-lg">
                        <Shield className="w-4 h-4" />
                        <span>Модератор</span>
                      </span>
                    )}
                    {user.usergroup === 'user' && (
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-full flex items-center space-x-2 shadow-lg">
                        <Shield className="w-4 h-4" />
                        <span>Пользователь</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-3">
                  {currentUser?.id === user.id && (
                    <button
                      onClick={() => navigate('/settings')}
                      className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-lg"
                    >
                      <SettingsIcon className="w-6 h-6" />
                    </button>
                  )}
                  
                  {currentUser?.usergroup === 'admin' && currentUser?.id !== user.id && (
                    <button
                      onClick={() => setShowAdminActions(!showAdminActions)}
                      className={`p-3 rounded-xl transition-colors shadow-lg ${
                        showAdminActions 
                          ? 'bg-red-600 hover:bg-red-700' 
                          : 'bg-gray-600 hover:bg-gray-700'
                      } text-white`}
                      title={showAdminActions ? 'Скрыть панель управления пользователем' : 'Управление пользователем'}
                    >
                      <Shield className="w-6 h-6" />
                    </button>
                  )}
                </div>
                  </div>
                </div>

              {/* Статистика */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{user.posts_count || 0}</div>
                <div className="text-gray-400 text-sm">Сообщений</div>
            </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{user.reputation || 0}</div>
                <div className="text-gray-400 text-sm">Репутация</div>
            </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{user.achievements?.length || 0}</div>
                <div className="text-gray-400 text-sm">Достижений</div>
            </div>
              <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-xl border border-gray-600/30 backdrop-blur-sm p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{new Date(user.created_at).getFullYear()}</div>
                <div className="text-gray-400 text-sm">Год регистрации</div>
        </div>
      </div>

            {/* Информация */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Информация</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Email:</span>
                      <span className="text-white">{user.email}</span>
        </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Дата регистрации:</span>
                  <span className="text-white">{new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                <div className="flex items-center space-x-3">
                  <Eye className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-300">Последний вход:</span>
                  <span className="text-white">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Никогда'}</span>
                    </div>
                </div>
              </div>

            {/* Активность */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Активность</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-300">Статус:</span>
                  <span className="px-3 py-1 bg-green-600 text-white text-sm rounded-full">
                    Активен
                      </span>
                  </div>
                {user.is_banned && (
                  <div className="flex items-center space-x-3">
                    <Ban className="w-5 h-5 text-red-400" />
                    <span className="text-red-400">Заблокирован</span>
                  </div>
                )}
                    {user.is_muted && (
                  <div className="flex items-center space-x-3">
                    <VolumeX className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-400">Заглушен</span>
                </div>
              )}
                </div>
              </div>

            {/* Комментарии */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl border border-gray-600/30 backdrop-blur-sm p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Комментарии в профиле</span>
              </h2>
              
              {/* Форма добавления комментария с богатым редактором */}
              {currentUser && (
                <div className="mb-8">
                  {/* Панель инструментов */}
                  <div className="bg-gray-700/50 rounded-t-xl border border-gray-600/30 p-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => insertFormatting('bold')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Жирный"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('italic')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Курсив"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('underline')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Подчеркивание"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('strikethrough')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Зачеркивание"
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => insertFormatting('code')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Код"
                    >
                      <Code className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('quote')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Цитата"
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting('link')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Ссылка"
                    >
                      <Link className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => insertFontSize('small')}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors"
                        title="Маленький шрифт"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFontSize('large')}
                        className="px-2 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors"
                        title="Большой шрифт"
                      >
                        A
                      </button>
                      <button
                        type="button"
                        onClick={() => insertFontSize('huge')}
                        className="px-2 py-1 text-lg bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors"
                        title="Огромный шрифт"
                      >
                        A
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => insertFormatting('spoiler')}
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Спойлер"
                    >
                      <EyeOff className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Эмодзи"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Изображение"
                    >
                      <Image className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Отменить"
                    >
                      <Undo className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-600 rounded text-white transition-colors"
                      title="Повторить"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-600 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className={`p-2 rounded text-white transition-colors ${
                        showPreview ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-600'
                      }`}
                      title={showPreview ? "Редактировать" : "Предпросмотр"}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <span className="text-gray-400 text-sm ml-2">
                      {showPreview ? 'Редактировать' : 'Предпросмотр'}
                    </span>
                  </div>
                  
                  {/* Текстовое поле или предпросмотр */}
                  <form onSubmit={handleSubmitComment}>
                    {showPreview ? (
                      <div className="w-full p-4 bg-gray-700/50 border border-gray-600/30 border-t-0 rounded-b-xl min-h-[150px]">
                        {commentText.trim() ? (
                          <div 
                            className="text-gray-300 prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: parseMarkdown(commentText) }}
                          />
                        ) : (
                          <div className="text-gray-500 italic">Предпросмотр будет показан здесь...</div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        ref={textareaRef}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Оставьте комментарий в профиле этого пользователя..."
                        className="w-full p-4 bg-gray-700/50 border border-gray-600/30 border-t-0 rounded-b-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                      />
                    )}
                    <div className="flex justify-end mt-4">
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                      >
                        Отправить
                      </button>
                    </div>
                  </form>
                  </div>
                )}

                {/* Список комментариев */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    Пока нет комментариев
                          </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/20">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {comment.author?.username?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{comment.author?.username}</p>
                            <p className="text-gray-400 text-sm">
                              {new Date(comment.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {/* Кнопка удаления комментария */}
                        {(currentUser?.usergroup === 'admin' || currentUser?.id === user.id || currentUser?.id === comment.author_id) && (
                          <button
                            onClick={() => showDeleteCommentConfirmation(comment.id)}
                            disabled={deletingComment === comment.id}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                            title="Удалить комментарий"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div 
                        className="text-gray-300 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: parseMarkdown(comment.text) }}
                      />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Админская панель */}
          {showAdminActions && (
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-red-800/50 to-red-700/50 rounded-2xl border border-red-600/30 backdrop-blur-sm p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                    <AlertTriangle className="w-6 h-6" />
                    <span>Админ действия</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Модерация */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Модерация</h4>
                      <div className="space-y-2">
                        {user.is_banned ? (
                          <button
                            onClick={() => setShowUnbanModal(true)}
                            className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Разбанить</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowBanModal(true)}
                            className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                          >
                            <Ban className="w-4 h-4" />
                            <span>Забанить</span>
                          </button>
                        )}
                        
                        {user.is_muted ? (
                          <button
                            onClick={() => setShowUnmuteModal(true)}
                            className="w-full p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                          >
                            <VolumeX className="w-4 h-4" />
                            <span>Размутить</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => setShowMuteModal(true)}
                            className="w-full p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                          >
                            <VolumeX className="w-4 h-4" />
                            <span>Замутить</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Управление */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Управление</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => setShowGroupChange(true)}
                          className="w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Изменить группу</span>
                        </button>
                        
                        <button 
                          onClick={() => setShowAchievementModal(true)}
                          className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>Достижения</span>
                        </button>
                      </div>
                    </div>

                    {/* Информация */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Информация</h4>
                      <div className="space-y-2">
                        <button 
                          onClick={() => {
                            setShowIpModal(true);
                            loadUserIp();
                          }}
                          className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Посмотреть IP</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            setShowAccountsModal(true);
                            loadRelatedAccounts();
                          }}
                          className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
                        >
                          <User className="w-4 h-4" />
                          <span>Связанные аккаунты</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      {/* Модальное окно смены группы */}
      {showGroupChange && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Смена группы</h3>
            <div className="space-y-4">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="group"
                    value={group.name}
                    checked={selectedGroups.includes(group.name)}
                    onChange={(e) => setSelectedGroups([e.target.value])}
                    className="text-blue-600"
                  />
                  <span className="text-white">{group.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowGroupChange(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleGroupChange}
                disabled={selectedGroups.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно бана */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Заблокировать пользователя</h3>
            <p className="text-gray-300 mb-8">
              Вы уверены, что хотите заблокировать пользователя {user.username}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleBanUser}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Заблокировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно мута */}
      {showMuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Заглушить пользователя</h3>
            <p className="text-gray-300 mb-8">
              Вы уверены, что хотите заглушить пользователя {user.username}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowMuteModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleMuteUser}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Заглушить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно достижений */}
      {showAchievementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Добавить достижения</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {achievements.map((achievement) => (
                <label key={achievement.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedAchievements.includes(achievement.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedAchievements([...selectedAchievements, achievement.id]);
                      } else {
                        setSelectedAchievements(selectedAchievements.filter(id => id !== achievement.id));
                      }
                    }}
                    className="text-blue-600"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{achievement.icon || '🏆'}</span>
                    <div>
                      <span className="text-white font-medium">{achievement.name}</span>
                      <p className="text-gray-300 text-sm">{achievement.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowAchievementModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleAddAchievements}
                disabled={selectedAchievements.length === 0}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно IP */}
      {showIpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">IP адрес пользователя</h3>
            <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm mb-2">IP адрес:</p>
              <p className="text-white font-mono text-lg">{userIp || 'Загрузка...'}</p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowIpModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно связанных аккаунтов */}
      {showAccountsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Связанные аккаунты</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {relatedAccounts.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Связанные аккаунты не найдены</p>
              ) : (
                relatedAccounts.map((account) => (
                  <div key={account.id} className="bg-gray-700/50 rounded-lg p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {account.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{account.username}</p>
                      <p className="text-gray-400 text-sm">ID: {account.username}.{getNumericId(account.id)}</p>
                      <p className="text-gray-400 text-sm">Регистрация: {new Date(account.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        account.usergroup === 'admin' ? 'bg-red-600 text-white' :
                        account.usergroup === 'moderator' ? 'bg-yellow-600 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {account.usergroup}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAccountsModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно разбана */}
      {showUnbanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Разбанить пользователя</h3>
            <p className="text-gray-300 mb-8">
              Вы уверены, что хотите разбанить пользователя {user.username}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnbanModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleUnbanUser}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Разбанить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно размута */}
      {showUnmuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Размутить пользователя</h3>
            <p className="text-gray-300 mb-8">
              Вы уверены, что хотите размутить пользователя {user.username}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUnmuteModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleUnmuteUser}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Размутить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления комментария */}
      {showDeleteCommentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Удалить комментарий</h3>
            <p className="text-gray-300 mb-8">
              Вы уверены, что хотите удалить этот комментарий? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteCommentModal(false);
                  setCommentToDelete(null);
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteComment}
                disabled={deletingComment !== null}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {deletingComment ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно админской панели */}
      {showAdminShieldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Shield className="w-6 h-6" />
              <span>Админская панель</span>
            </h3>
            <p className="text-gray-300 mb-6">Управление пользователем: {user.username}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowAdminShieldModal(false);
                  setShowEnhancedGroupModal(true);
                }}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <Shield className="w-5 h-5" />
                <span>Управление группами</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminShieldModal(false);
                  setShowEnhancedAchievementsModal(true);
                }}
                className="w-full p-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <Trophy className="w-5 h-5" />
                <span>Управление достижениями</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminShieldModal(false);
                  setShowEnhancedMuteModal(true);
                }}
                className="w-full p-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <VolumeX className="w-5 h-5" />
                <span>Заглушить пользователя</span>
              </button>
              
              <button
                onClick={() => {
                  setShowAdminShieldModal(false);
                  setShowEnhancedBanModal(true);
                }}
                className="w-full p-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <Ban className="w-5 h-5" />
                <span>Заблокировать пользователя</span>
              </button>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAdminShieldModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Расширенное модальное окно управления группами */}
      {showEnhancedGroupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Управление группами</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Добавление групп */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Добавить группы</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {groups.filter(group => !userGroups.some(ug => ug.id === group.id)).map((group) => (
                    <label key={group.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedGroupsToAdd.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupsToAdd([...selectedGroupsToAdd, group.id]);
                          } else {
                            setSelectedGroupsToAdd(selectedGroupsToAdd.filter(id => id !== group.id));
                          }
                        }}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="text-white font-medium">{group.name}</span>
                        {group.color && (
                          <div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: group.color }}></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Удаление групп */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Удалить группы</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userGroups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedGroupsToRemove.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroupsToRemove([...selectedGroupsToRemove, group.id]);
                          } else {
                            setSelectedGroupsToRemove(selectedGroupsToRemove.filter(id => id !== group.id));
                          }
                        }}
                        className="text-red-600"
                      />
                      <div>
                        <span className="text-white font-medium">{group.name}</span>
                        {group.color && (
                          <div className="w-4 h-4 rounded-full mt-1" style={{ backgroundColor: group.color }}></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowEnhancedGroupModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleManageUserGroups}
                disabled={selectedGroupsToAdd.length === 0 && selectedGroupsToRemove.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Расширенное модальное окно управления достижениями */}
      {showEnhancedAchievementsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Управление достижениями</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Добавление достижений */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Добавить достижения</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {achievements.filter(achievement => !userAchievements.some(ua => ua.id === achievement.id)).map((achievement) => (
                    <label key={achievement.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAchievementsToAdd.includes(achievement.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAchievementsToAdd([...selectedAchievementsToAdd, achievement.id]);
                          } else {
                            setSelectedAchievementsToAdd(selectedAchievementsToAdd.filter(id => id !== achievement.id));
                          }
                        }}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="text-white font-medium">{achievement.name}</span>
                        <p className="text-gray-300 text-sm">{achievement.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Удаление достижений */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Удалить достижения</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userAchievements.map((achievement) => (
                    <label key={achievement.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedAchievementsToRemove.includes(achievement.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAchievementsToRemove([...selectedAchievementsToRemove, achievement.id]);
                          } else {
                            setSelectedAchievementsToRemove(selectedAchievementsToRemove.filter(id => id !== achievement.id));
                          }
                        }}
                        className="text-red-600"
                      />
                      <div>
                        <span className="text-white font-medium">{achievement.name}</span>
                        <p className="text-gray-300 text-sm">{achievement.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => setShowEnhancedAchievementsModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleManageUserAchievements}
                disabled={selectedAchievementsToAdd.length === 0 && selectedAchievementsToRemove.length === 0}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Расширенное модальное окно бана с временем */}
      {showEnhancedBanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Заблокировать пользователя</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Причина бана</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Введите причину бана..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Срок бана</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    placeholder="1"
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500"
                    disabled={banDurationType === 'forever'}
                  />
                  <select
                    value={banDurationType}
                    onChange={(e) => setBanDurationType(e.target.value)}
                    className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                  >
                    <option value="hours">Часов</option>
                    <option value="days">Дней</option>
                    <option value="forever">Навсегда</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowEnhancedBanModal(false);
                  setBanDuration('');
                  setBanReason('');
                  setBanDurationType('hours');
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleEnhancedBanUser}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Заблокировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Расширенное модальное окно мута с временем */}
      {showEnhancedMuteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Заглушить пользователя</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Причина мута</label>
                <textarea
                  value={muteReason}
                  onChange={(e) => setMuteReason(e.target.value)}
                  placeholder="Введите причину мута..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">Срок мута</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={muteDuration}
                    onChange={(e) => setMuteDuration(e.target.value)}
                    placeholder="1"
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-orange-500"
                    disabled={muteDurationType === 'forever'}
                  />
                  <select
                    value={muteDurationType}
                    onChange={(e) => setMuteDurationType(e.target.value)}
                    className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="hours">Часов</option>
                    <option value="days">Дней</option>
                    <option value="forever">Навсегда</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowEnhancedMuteModal(false);
                  setMuteDuration('');
                  setMuteReason('');
                  setMuteDurationType('hours');
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleEnhancedMuteUser}
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                Заглушить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для создания ссылки */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md mx-4">
            <h3 className="text-2xl font-bold text-white mb-6">Создать ссылку</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Текст ссылки</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Введите текст ссылки..."
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-white text-sm font-medium mb-2">URL ссылки</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkText('');
                  setLinkUrl('');
                }}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={insertLink}
                disabled={!linkText.trim() || !linkUrl.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Создать ссылку
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default UserProfile;