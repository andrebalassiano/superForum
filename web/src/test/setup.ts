import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library mounts components into a real (jsdom) document that persists between tests in the
// same file. Unmounting after each one keeps tests independent — otherwise a query like
// getByRole('button', { name: 'Upvote' }) could match a leftover from the previous test.
afterEach(cleanup);
