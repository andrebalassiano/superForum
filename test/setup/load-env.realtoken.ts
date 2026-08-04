// Env for the real-token lane. Load the base throwaway-DB config first, then overlay
// .env.test.realtoken (the Supabase project + a real test user's credentials). If the
// realtoken file is absent, the Supabase creds stay undefined and the suite skips — while
// DATABASE_URL from .env.test keeps the Prisma harness usable so nothing crashes on import.
import { config } from 'dotenv';

config({ path: '.env.test', override: true });
config({ path: '.env.test.realtoken', override: true });
