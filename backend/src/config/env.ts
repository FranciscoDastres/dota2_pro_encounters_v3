import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    OPENDOTA_API_URL: z.string().url().default('https://api.opendota.com/api'),
    OPENDOTA_API_KEY: z.string().default(''),
    SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.FRONTEND_URL.startsWith('https://')) {
      ctx.addIssue({
        code: 'custom',
        message: 'FRONTEND_URL must use HTTPS in production',
        path: ['FRONTEND_URL'],
      })
    }
  })

const result = envSchema.safeParse(process.env)

if (!result.success) {
  const issues = result.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  console.error(`[env] Invalid or missing environment variables:\n${issues}`)
  process.exit(1)
}

const parsed = result.data

export const env = {
  PORT: parsed.PORT,
  NODE_ENV: parsed.NODE_ENV,
  FRONTEND_URL: parsed.FRONTEND_URL,
  OPENDOTA_API_URL: parsed.OPENDOTA_API_URL,
  OPENDOTA_API_KEY: parsed.OPENDOTA_API_KEY,
  SUPABASE_URL: parsed.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY,
  get isDevelopment() {
    return this.NODE_ENV === 'development'
  },
  get isProduction() {
    return this.NODE_ENV === 'production'
  },
}
