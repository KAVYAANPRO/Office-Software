import * as Joi from 'joi';

/**
 * The process refuses to start on a missing or malformed value (tech.md T-15 / §3.5).
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  COOKIE_SECRET: Joi.string().min(32).required(),

  MONGO_URI: Joi.string().uri().required(),

  SESSION_IDLE_TIMEOUT_MINUTES: Joi.number().default(60),
  SESSION_ABSOLUTE_TIMEOUT_HOURS: Joi.number().default(12),

  ARGON2_MEMORY_COST: Joi.number().default(19456),
  ARGON2_TIME_COST: Joi.number().default(2),
  ARGON2_PARALLELISM: Joi.number().default(1),

  LOGIN_MAX_ATTEMPTS: Joi.number().default(5),
  LOGIN_WINDOW_MINUTES: Joi.number().default(15),
  LOGIN_LOCKOUT_MINUTES: Joi.number().default(15),

  COMPANY_LEGAL_NAME: Joi.string().default('Demo Garment Co'),
  COMPANY_STATE: Joi.string().default('Maharashtra'),
  COMPANY_GSTIN: Joi.string().default(''),
  CURRENT_FINANCIAL_YEAR: Joi.string().default('26-27'),
});
