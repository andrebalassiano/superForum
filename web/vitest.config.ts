import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Test config, kept separate from vite.config.ts so the build config stays about building.
// Tailwind's plugin isn't here on purpose: tests assert on structure and behaviour (roles, labels,
// text), never on computed styles, so processing CSS would only cost time.
export default defineConfig({
    plugins: [react()],
    test: {
        // Components need a DOM. jsdom provides one inside Node.
        environment: 'jsdom',
        // Registers jest-dom's matchers (toBeInTheDocument, toHaveAttribute, ...) once for every
        // test file, and clears the DOM between tests.
        setupFiles: ['./src/test/setup.ts'],
        // Without this, `describe`/`it`/`expect` would have to be imported in every file.
        globals: true,
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
