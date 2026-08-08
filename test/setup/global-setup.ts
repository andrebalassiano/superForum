// Runs ONCE before the whole test run (separate context from the test files, so it
// can't register beforeEach hooks — that's each-setup's job). Its single job: bring the
// test database's schema up to date by replaying the committed migrations against it.
//
// `prisma migrate deploy` is the non-interactive sibling of `migrate dev`: it applies
// existing migration files, no prompts, safe for automation. prisma.config.ts resolves
// the datasource from env("DATABASE_URL"), so we load .env.test here too before spawning.
import { config } from 'dotenv';
import { execSync } from 'node:child_process';

export default function setup() {
    config({ path: '.env.test', override: true });

    execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
    });
}
