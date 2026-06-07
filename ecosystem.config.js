/**
 * Nusantara CRM - PM2 Ecosystem Configuration
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 stop ecosystem.config.js
 *   pm2 restart ecosystem.config.js
 *   pm2 save  (to persist across reboots)
 */

module.exports = {
  apps: [
    {
      name: 'nusantara-json-server',
      script: 'json-server',
      args: '--watch src/data/db.json --port 3001 --host 127.0.0.1',
      cwd: '/var/www/nusantara-crm',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Logging
      log_file: '/var/log/nusantara-crm/json-server.log',
      error_file: '/var/log/nusantara-crm/json-server-error.log',
      out_file: '/var/log/nusantara-crm/json-server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
