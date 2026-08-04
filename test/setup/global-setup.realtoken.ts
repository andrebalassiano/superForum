// Runs once before the real-token lane. Migrates the throwaway DB — but only when the Supabase
// creds are present. With no creds the whole suite skips, so there's nothing to migrate for;
// returning early lets `npm run test:realtoken` pass cleanly on a machine with zero config.
import { config } from 'dotenv';
import { execSync } from 'node:child_process';

export default function setup() {
    config({ path: '.env.test', override: true });
    config({ path: '.env.test.realtoken', override: true });

    const hasCreds =
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_PUBLISHABLE_KEY &&
        process.env.SUPABASE_TEST_EMAIL &&
        process.env.SUPABASE_TEST_PASSWORD;

    if (!hasCreds) {
        console.log('[realtoken] Supabase creds absent — skipping migrate; the suite will skip.');
        return;
    }

    execSync('npx prisma migrate deploy', { stdio: 'inherit', env: process.env });
}
