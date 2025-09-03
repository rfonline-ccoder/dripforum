import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, MessageCircle, Shield, Download } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/80"></div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Main Logo */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 neon-glow">
                ARIZONA
              </span>
            </h1>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6">
              DRIP
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Премиальный опыт ролевой игры
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button className="btn btn-primary px-8 py-4 text-lg font-semibold flex items-center gap-3 group">
              <Download className="w-6 h-6" />
              СКАЧАТЬ ЛАУНЧЕР
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            
            <Link 
              to="/forum" 
              className="btn btn-secondary px-8 py-4 text-lg font-semibold flex items-center gap-3 group"
            >
              <MessageCircle className="w-6 h-6" />
              ПЕРЕЙТИ НА ФОРУМ
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="card p-6 text-center card-hover">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">15,000+</div>
              <div className="text-gray-400">Активных игроков</div>
            </div>
            
            <div className="card p-6 text-center card-hover">
              <MessageCircle className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">50,000+</div>
              <div className="text-gray-400">Сообщений на форуме</div>
            </div>
            
            <div className="card p-6 text-center card-hover">
              <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white mb-1">24/7</div>
              <div className="text-gray-400">Поддержка</div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Почему <span className="text-purple-400">Arizona DRIP</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Мы создали уникальную экосистему для ролевых игр с самыми современными технологиями
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Активное сообщество</h3>
              <p className="text-gray-300">
                Присоединяйтесь к тысячам игроков в живом и дружелюбном сообществе
              </p>
            </div>

            <div className="card p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Честная игра</h3>
              <p className="text-gray-300">
                Строгая модерация и античит система обеспечивают честную игру для всех
              </p>
            </div>

            <div className="card p-8 card-hover text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Богатый RP</h3>
              <p className="text-gray-300">
                Глубокая ролевая система с множеством профессий и возможностей
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="card p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Готовы начать свое приключение?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Присоединяйтесь к Arizona DRIP сегодня и окунитесь в мир безграничных возможностей
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary px-8 py-4 text-lg font-semibold">
                Скачать лаунчер
              </button>
              <Link to="/register" className="btn btn-secondary px-8 py-4 text-lg font-semibold">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-white font-bold text-xl">
                  Arizona <span className="text-purple-400">DRIP</span>
                </span>
              </div>
              <p className="text-gray-300 mb-4 max-w-md">
                Премиальный опыт ролевой игры с уникальными возможностями и дружелюбным сообществом.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Навигация</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Главная</Link></li>
                <li><Link to="/forum" className="text-gray-300 hover:text-white transition-colors">Форум</Link></li>
                <li><Link to="/rules" className="text-gray-300 hover:text-white transition-colors">Правила</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Документы</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Пользовательское соглашение</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Политика конфиденциальности</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-gray-300">
              © 2024 Arizona DRIP. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;