import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().optional(),
  OPENAI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(10),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  DEVELOPMENT_MODE: z.string().optional()
  ,ACCESS_TOKEN_TTL_MIN: z.string().optional() // minutes
  ,REFRESH_TOKEN_TTL_DAYS: z.string().optional()
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = (() => {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
})();

// Provide defaults if not set
if (!env.ACCESS_TOKEN_TTL_MIN) {
  (env as Env & { ACCESS_TOKEN_TTL_MIN: string }).ACCESS_TOKEN_TTL_MIN = '15';
}
if (!env.REFRESH_TOKEN_TTL_DAYS) {
  (env as Env & { REFRESH_TOKEN_TTL_DAYS: string }).REFRESH_TOKEN_TTL_DAYS = '7';
}
