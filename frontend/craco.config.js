// Load configuration from environment or config file
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      // Добавляем игнорируемые папки для оптимизации
      webpackConfig.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };
      
      return webpackConfig;
    },
  },
};