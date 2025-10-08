module.exports = {
  apps: [{
    name: 'kinezio_life',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/kinezio_life',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/kinezio_life_error.log',
    out_file: '/var/log/pm2/kinezio_life_out.log',
    log_file: '/var/log/pm2/kinezio_life_combined.log',
    time: true
  }]
};
