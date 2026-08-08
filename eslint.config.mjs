import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
    // Never lint generated or build output. The Prisma client alone is ~14k lines of machine
    // output, and dist/coverage are artifacts.
    { ignores: ['src/generated/**', 'dist/**', 'coverage/**'] },

    // Baseline JS rules everywhere.
    js.configs.recommended,

    // Type-checked TypeScript rules — the whole point of this setup. The parser reads
    // tsconfig.eslint.json (a lint-only program that spans src + test + config files) so type-aware
    // rules (no-floating-promises, no-misused-promises, await-thenable) can see real types.
    {
        files: ['**/*.ts'],
        extends: [tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname,
            },
            globals: { ...globals.node },
        },
        rules: {
            // Off by design: the controllers are object-literal handler namespaces
            // (`const postsController = { async getPosts() {…} }`) passed to Express by reference.
            // unbound-method guards against detaching a class method from its `this`, but these
            // handlers never use `this` — Express calls them free-standing on purpose. There are no
            // classes in this codebase, so the rule only ever fires as a false positive here.
            '@typescript-eslint/unbound-method': 'off',
        },
    },

    // Integration tests drive the app over HTTP and assert on supertest's `res.body`, which is typed
    // `any` by design — so the "unsafe any" family fires on every `res.body.items`/`.error` even
    // though that's exactly what an end-to-end test is supposed to do. Relax that family (and the
    // async-mock rules) for tests; the type-aware rules still guard the real source under src/.
    {
        files: ['test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unnecessary-type-assertion': 'off',
        },
    },

    // Plain JS/config files (this config, any .cjs) aren't in the TS program, so turn the
    // type-aware rules back off for them to avoid "file not included in project" errors.
    {
        files: ['**/*.{js,mjs,cjs}'],
        extends: [tseslint.configs.disableTypeChecked],
        languageOptions: { globals: { ...globals.node } },
    },

    // MUST be last: switches off every ESLint rule that would fight Prettier over formatting.
    eslintConfigPrettier,
);
