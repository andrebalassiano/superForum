// Truncate between tests — same clean-slate guarantee as the mocked lane, but with NO Supabase
// mock, so requireAuth calls the real supabase.auth.getUser() against the real JWT. truncateAll
// (and thus the Prisma singleton) is imported lazily inside the hook so that when the suite skips
// for lack of creds, the hook never runs and the DB is never touched.
import { beforeEach } from 'vitest';

beforeEach(async () => {
    const { truncateAll } = await import('../helpers/db');
    await truncateAll();
});
