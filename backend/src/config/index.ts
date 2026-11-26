'use strict';

const required = ['DATABASE_URL', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const isProd = process.env.NODE_ENV === 'production';
if (isProd && (process.env.JWT_SECRET || '').length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}

export interface AppConfig {
  isProd: boolean;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  databaseCa: string | null;
  jwtSecret: string;
  msg91Authkey: string | null;
  msg91TemplateId: string | null;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string | null;
}

const config: AppConfig = {
  isProd,
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost',
  databaseUrl: process.env.DATABASE_URL as string,
  databaseCa: process.env.DATABASE_CA || null,
  jwtSecret: process.env.JWT_SECRET as string,
  msg91Authkey: process.env.MSG91_AUTHKEY || null,
  msg91TemplateId: process.env.MSG91_TEMPLATE_ID || null,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID as string,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET as string,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
};

export default config;
