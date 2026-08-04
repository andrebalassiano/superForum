import path from 'node:path';
import fs from 'node:fs';
import { defineConfig } from 'vitest/config';

// Mirrors the prismaTsResolver in vitest.config.ts — kept as a copy so the two lanes stay fully
// independent. If the Prisma output location ever moves, update both. See that file for the full
// explanation of why the generated client has to be resolved to its .ts sources under Vite.
const GEN_DIR = path.resolve(__dirname, 'src/generated/prisma').replace(/\\/g, '/');

function prismaTsResolver() {
    return {
        name: 'prisma-generated-ts-resolver',
        enforce: 'pre' as const,
        resolveId(source: string, importer: string | undefined) {
            if (source.endsWith('generated/prisma/client')) {
                return path.join(GEN_DIR, 'client.ts');
            }
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

// The opt-in, real-Supabase lane. Separate from vitest.config.ts precisely so it can run WITHOUT
// the Supabase mock and only when real creds are present. Run with `npm run test:realtoken`.
export default defineConfig({
    plugins: [prismaTsResolver()],
    test: {
        environment: 'node',
        include: ['test/realtoken/**/*.test.ts'],

        // load-env.realtoken first (sets DATABASE_URL + Supabase creds); each-setup.realtoken
        // truncates between tests. Notably NO Supabase mock — that's the whole point of this lane.
        setupFiles: ['./test/setup/load-env.realtoken.ts', './test/setup/each-setup.realtoken.ts'],
        globalSetup: ['./test/setup/global-setup.realtoken.ts'],

        fileParallelism: false,
    },
});
