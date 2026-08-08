import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vitest/config';

// The Prisma 7 client is generated to src/generated/prisma as a full TypeScript tree
// (client.ts, enums.ts, internal/*.ts, models/*.ts) plus a PARTIAL, hybrid .js tree
// (CommonJS `exports`/`require` mixed with `import.meta.url`, and missing files like
// internal/class.js). The app runs via tsx, which resolves the .ts sources; but Vite
// prefers .js and the generated .ts files import siblings with explicit .js extensions
// (NodeNext style). This plugin does what tsx does: resolve every generated import to
// its real .ts source so Vitest transforms the clean TypeScript instead of the broken JS.
const GEN_DIR = path.resolve(__dirname, 'src/generated/prisma').replace(/\\/g, '/');

function prismaTsResolver() {
    return {
        name: 'prisma-generated-ts-resolver',
        enforce: 'pre' as const,
        resolveId(source: string, importer: string | undefined) {
            // Entry point: prismaSingleton imports '.../generated/prisma/client' (no extension).
            if (source.endsWith('generated/prisma/client')) {
                return path.join(GEN_DIR, 'client.ts');
            }

            // Relative .js imports made from WITHIN the generated tree → their .ts siblings.
            if (importer && source.startsWith('.') && source.endsWith('.js')) {
                const imp = importer.replace(/\\/g, '/');
                if (imp.startsWith(GEN_DIR)) {
                    const tsCandidate = path
                        .resolve(path.dirname(importer), source)
                        .replace(/\.js$/, '.ts');
                    if (fs.existsSync(tsCandidate)) {
                        return tsCandidate;
                    }
                }
            }

            return null;
        },
    };
}

export default defineConfig({
    plugins: [prismaTsResolver()],
    test: {
        // Node, not jsdom — this is a backend API suite.
        environment: 'node',

        // Only the mocked integration lane. The real-token lane (test/realtoken) has its own
        // config (vitest.realtoken.config.ts) and needs real Supabase creds, so it's kept out of
        // the default, secret-free `npm test` run.
        include: ['test/integration/**/*.test.ts'],

        // load-env MUST come first: it points DATABASE_URL at the test DB before any
        // helper (and therefore the Prisma singleton) is imported. each-setup then
        // registers the Supabase mock and the truncate-between-tests hook.
        setupFiles: [
            './test/setup/load-env.ts',
            './test/setup/silence-pg-warning.ts',
            './test/setup/each-setup.ts',
        ],

        // Runs once before the whole suite: migrate deploy against the test DB.
        globalSetup: ['./test/setup/global-setup.ts'],

        // The suite shares one Postgres, and each test truncates it — so files must
        // NOT run in parallel or they'd wipe each other's rows mid-flight.
        fileParallelism: false,

        coverage: {
            provider: 'v8',
            // 'text' prints the table locally; 'lcov' writes coverage/lcov.info for Codecov.
            reporter: ['text', 'lcov'],
            include: ['src/**/*.ts'],
            // Generated Prisma client and the server bootstrap aren't unit-under-test.
            exclude: ['src/generated/**', 'src/server.ts'],
        },
    },
});
