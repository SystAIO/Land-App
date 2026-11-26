// PM2 process definition for the Land-App backend.
// Used by scripts/setup-server.sh and scripts/update.sh.
module.exports = {
  apps: [
    {
      name: 'land-app',
      cwd: '/var/www/Land-App/backend',
      script: './dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      out_file: '/var/log/land-app/out.log',
      error_file: '/var/log/land-app/error.log',
      merge_logs: true,
      time: true,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
