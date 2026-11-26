import 'dotenv/config';

import config from './config';
import app from './app';
import { pool } from './db/pool';

async function start() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection failed:', message);
    process.exit(1);
  }

  app.listen(config.port, () => {
    console.log(`🚀 SystIO Backend listening on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

void start();
