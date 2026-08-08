import prisma from '../../src/core/prismaSingleton';

// Every table, wiped between tests so each starts from an empty, deterministic DB.
// CASCADE handles the foreign keys (a Community delete cascades to its Posts, etc.);
// RESTART IDENTITY resets any sequence counters. Order doesn't matter with CASCADE,
// but the child-first listing keeps intent obvious.
const TABLES = ['PostVote', 'CommentVote', 'Comment', 'Post', 'Community', 'Profile'] as const;

export async function truncateAll() {
    const list = TABLES.map((t) => `"${t}"`).join(', ');
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
}
