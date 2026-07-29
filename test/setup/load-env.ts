// Runs first among setupFiles. Loads .env.test with override so its DATABASE_URL wins
// over anything the app's own `import 'dotenv/config'` (which reads .env) would set.
// This guarantees every Prisma query in a test hits the throwaway test database,
// never the real one.
import { config } from 'dotenv';

config({ path: '.env.test', override: true });