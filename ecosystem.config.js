/**
 * PM2 Ecosystem Configuration for Stream Monitor Worker
 *
 * TECH-001 Mitigation: PM2 provides:
 * - Auto-restart on crashes
 * - Memory limit enforcement
 * - Log rotation
 * - Process monitoring
 *
 * Usage:
 *   npm run worker:start   - Start worker
 *   npm run worker:stop    - Stop worker
 *   npm run worker:restart - Restart worker
 *   npm run worker:logs    - View logs
 *   npm run worker:status  - Check status
 */

module.exports = {
  apps: [
    {
      name: 'antone-stream-monitor',
      script: 'dist/workers/stream-monitor.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      env: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 3000,
      // Restart on error
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
