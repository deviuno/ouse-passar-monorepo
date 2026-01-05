/**
 * PM2 Ecosystem Configuration for Parallel Scraper Workers
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --only scraper-worker-1
 *   pm2 stop all
 *   pm2 logs
 *
 * Cada worker processa comandos para sua conta específica.
 * Para usar múltiplos workers, cada conta precisa ter seus próprios cookies.
 */

module.exports = {
  apps: [
    // Main server
    {
      name: 'mastra',
      script: 'dist/server.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    // Worker 1 - alfredo_dias
    {
      name: 'scraper-worker-1',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: 'c8df0607-7886-4dda-b586-741e90732954'
      }
    },
    // Worker 2 - engenheirosdaweb2
    {
      name: 'scraper-worker-2',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: '6d333901-4b20-45de-8013-faf6c03b68b6'
      }
    },
    // Worker 3 - enrico_campos
    {
      name: 'scraper-worker-3',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: '683c8e66-adaf-4cfb-a76b-3adeb6bc2995'
      }
    },
    // Worker 4 - feaurora1
    {
      name: 'scraper-worker-4',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: '52356e35-e4d2-498b-b7e2-1c5bb6192d46'
      }
    },
    // Worker 5 - isaaccaleb39
    {
      name: 'scraper-worker-5',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: '48a72fc1-d1db-48c0-a208-a7f47b4a3760'
      }
    },
    // Worker 6 - sebastian-alves
    {
      name: 'scraper-worker-6',
      script: 'dist/scraper-worker.js',
      cwd: '/root/ouse-passar-monorepo/packages/mastra',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        SCRAPER_ACCOUNT_ID: 'ef7536b1-9ddd-46e7-8a41-535f36e339e2'
      }
    },
  ]
};
