import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(32).default('super-secret-key-change-in-production'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
});

type EnvVars = z.infer<typeof envSchema>;

// Validate environment variables
const envVars = envSchema.safeParse(process.env);

if (!envVars.success) {
  console.error('❌ Invalid environment variables:', envVars.error.format());
  process.exit(1);
}

// Export validated environment variables
export const env = envVars.data;

// Export CORS configuration
export const corsConfig = {
  origin: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: true,
};

// Export JWT configuration
export const jwtConfig = {
  secret: env.JWT_SECRET,
  expiresIn: '24h', // Token expiration time
};

// Export server configuration
export const serverConfig = {
  port: parseInt(env.PORT, 10),
  isProduction: env.NODE_ENV === 'production',
  isDevelopment: env.NODE_ENV === 'development',
  isTest: env.NODE_ENV === 'test',
};
