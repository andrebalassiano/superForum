// Fills a database with demo content: a handful of authors, four communities, a dozen posts with
// comments and votes. A deployed forum with two posts in it reads as broken rather than new, so
// this exists mainly to make the live demo worth looking at — but it's just as useful locally,
// where it beats clicking through the UI to build a feed worth testing against.
//
// Run it with `npm run seed`.
//
// It is idempotent: every row has a fixed id and is upserted, so running it twice updates the same
// rows instead of duplicating them. It only ever adds or updates its own rows — nothing already in
// the database is touched or deleted.
//
// The authors here are Profile rows with no matching Supabase account, which is fine: a Profile is
// just the forum-side identity that posts and comments point at, and nothing signs in as them. The
// demo account a visitor actually uses is a real sign-up, made through the app (see the README).
import prisma from '../src/core/prismaSingleton';

// Readable, stable ids. The middle groups keep the version/variant nibbles a v4 UUID would have, so
// these pass a strict UUID check anywhere one is applied.
function id(prefix: string, n: number) {
    return `${prefix}-0000-4000-8000-${n.toString().padStart(12, '0')}`;
}

const userId = (i: number) => id('5eedface', i + 1);
const communityId = (i: number) => id('5eedc0de', i + 1);
const postId = (i: number) => id('5eedb00c', i + 1);
const commentId = (i: number) => id('5eedca11', i + 1);

const HOUR = 60 * 60 * 1000;
// Everything is dated relative to the moment the seed runs, so the feed never looks abandoned:
// re-running it moves the content back to "recent".
const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * HOUR);

const USERNAMES = ['maya_builds', 'devon', 'priya_k', 'tomas', 'june'];

const COMMUNITIES = [
    { name: 'announcements', owner: 0 },
    { name: 'webdev', owner: 1 },
    { name: 'typescript', owner: 2 },
    { name: 'showerthoughts', owner: 3 },
];

interface SeedComment {
    author: number;
    body: string;
    hours: number;
    up?: number[];
    down?: number[];
}

interface SeedPost {
    community: number;
    author: number;
    title: string;
    body: string;
    hours: number;
    up?: number[];
    down?: number[];
    comments?: SeedComment[];
}

// Vote arrays hold author indexes, and the post's score is computed from them rather than written
// by hand — the score column is denormalized, and seeding it inconsistently with the votes it's
// supposed to summarize would be a lie the app would eventually trip over.
const POSTS: SeedPost[] = [
    {
        community: 0,
        author: 0,
        title: 'Welcome to superForum',
        body: 'This is a demo forum. Sign in with the demo account (or make your own) and you can post, comment, and vote like anywhere else.\n\nEverything here is seeded content — feel free to add to it.',
        hours: 200,
        up: [1, 2, 3, 4],
        comments: [
            {
                author: 2,
                body: 'The dark mode following the system theme is a nice touch.',
                hours: 190,
                up: [0, 1],
            },
            { author: 4, body: 'Voting feels instant. Optimistic updates?', hours: 150, up: [0] },
        ],
    },
    {
        community: 1,
        author: 1,
        title: 'What finally made cursor pagination click for me',
        body: "Offset pagination looks simpler until someone posts while you're on page two, and suddenly you're reading a row you already read. A cursor points at a specific row, so the page after it is stable no matter what got inserted in front.\n\nThe cost is that you can't jump to page seven. For a feed nobody wants to.",
        hours: 96,
        up: [0, 2, 3, 4],
        down: [],
        comments: [
            {
                author: 3,
                body: 'The tie-breaker is the part people miss. Sorting by createdAt alone breaks the moment two rows share a timestamp — you need a second, unique column in the ORDER BY.',
                hours: 90,
                up: [1, 2],
            },
            {
                author: 0,
                body: 'This is exactly why the feed here returns { items, nextCursor } instead of a bare array.',
                hours: 80,
            },
        ],
    },
    {
        community: 2,
        author: 2,
        title: 'Inferring types from your validation schema instead of writing them twice',
        body: 'If the schema already describes the shape, deriving the type from it means the two can never drift. Change the schema, the type changes, and every call site that no longer fits stops compiling.\n\nWriting an interface next to a schema is how you end up with a validator that accepts something your types say is impossible.',
        hours: 72,
        up: [0, 1, 4],
        comments: [
            {
                author: 1,
                body: 'Same idea as generating your DB client from the schema rather than hand-typing the rows.',
                hours: 60,
                up: [2],
            },
        ],
    },
    {
        community: 1,
        author: 3,
        title: 'Optimistic updates are mostly about the rollback',
        body: 'Applying the change before the server answers is the easy half. The half that decides whether it feels solid is putting it back exactly as it was when the request fails — including every other view showing the same thing.',
        hours: 54,
        up: [0, 1, 2],
        down: [4],
        comments: [
            {
                author: 4,
                body: 'Fair, I take the downvote back in spirit. Snapshot the old value in onMutate, restore it in onError.',
                hours: 40,
                up: [3],
            },
        ],
    },
    {
        community: 3,
        author: 4,
        title: 'Every cache is a bet that the world has not changed yet',
        body: 'And invalidation is just admitting you lost.',
        hours: 48,
        up: [0, 1, 2, 3],
        comments: [{ author: 0, body: 'Putting this above my desk.', hours: 44, up: [4] }],
    },
    {
        community: 2,
        author: 0,
        title: 'The unknown-key question',
        body: "Silently dropping a field the client sent hides typos. Rejecting the request surfaces them immediately, at the cost of being strict about what you accept.\n\nThis forum rejects them: send a key the schema doesn't know about and you get a 400 explaining which one.",
        hours: 36,
        up: [2, 3],
        down: [1],
        comments: [
            {
                author: 1,
                body: "I'd rather strip and log, personally. Rejecting breaks older clients the moment you rename anything.",
                hours: 30,
                up: [4],
            },
            {
                author: 3,
                body: 'That only bites if the field was optional. Renaming a required field breaks them either way.',
                hours: 24,
                up: [0, 2],
            },
        ],
    },
    {
        community: 1,
        author: 2,
        title: 'Deploying it taught me more than building it',
        body: 'Three things broke, and none of them could break locally: a client generated as ESM into a CommonJS build, a validation library sitting in devDependencies, and a production install skipping the compiler needed to build.\n\nAll three were invisible until something ran the real start command.',
        hours: 30,
        up: [0, 1, 3, 4],
        comments: [
            {
                author: 0,
                body: 'Rehearsing the production build locally before the first deploy is the cheapest habit in the world.',
                hours: 26,
                up: [2, 3],
            },
        ],
    },
    {
        community: 3,
        author: 1,
        title: 'Naming a thing is just deciding what it is not',
        body: 'Spent an hour on a variable name today and the hour was the actual work.',
        hours: 26,
        up: [3, 4],
    },
    {
        community: 2,
        author: 3,
        title: 'Sentinel values beat throwing for expected outcomes',
        body: '"Not found" and "not yours" aren\'t exceptional — they\'re two of the answers the function has. Returning a distinct value for each lets the layer above map them to a 404 and a 403 without unwrapping an error to find out which happened.',
        hours: 20,
        up: [0, 2],
        comments: [
            {
                author: 2,
                body: 'The test for this is nice too: you assert on a return value instead of on which error type got thrown.',
                hours: 16,
                up: [3],
            },
        ],
    },
    {
        community: 1,
        author: 4,
        title: 'Accessible names are the API your UI exposes to everyone else',
        body: 'Swapping a label for an icon on small screens is fine until it takes the name with it. Put the name on the control with aria-label and hide the icon from the tree, and the button reads the same at every width.',
        hours: 14,
        up: [0, 1, 2],
        comments: [
            {
                author: 1,
                body: "It's also what makes tests readable — querying by role and name breaks when the meaning changes, not when a class does.",
                hours: 10,
                up: [4],
            },
        ],
    },
    {
        community: 0,
        author: 0,
        title: 'Free tiers sleep, and that is fine',
        body: 'The API here spins down after about fifteen minutes of quiet, so the first load after a lull can take a moment while it wakes. The loading skeletons cover it.',
        hours: 8,
        up: [1, 3],
    },
    {
        community: 3,
        author: 2,
        title: 'The bug is almost never where the error is',
        body: 'It is where the assumption was.',
        hours: 3,
        up: [0, 1, 3, 4],
        comments: [
            {
                author: 4,
                body: 'Hence reading logs top to bottom instead of jumping to the red line.',
                hours: 1,
                up: [2],
            },
        ],
    },
];

async function main() {
    for (const [i, username] of USERNAMES.entries()) {
        await prisma.profile.upsert({
            where: { id: userId(i) },
            update: { username },
            create: { id: userId(i), username },
        });
    }

    for (const [i, community] of COMMUNITIES.entries()) {
        await prisma.community.upsert({
            where: { id: communityId(i) },
            update: { name: community.name, ownerId: userId(community.owner) },
            create: {
                id: communityId(i),
                name: community.name,
                ownerId: userId(community.owner),
            },
        });
    }

    // A running counter, because comment ids are unique across all posts rather than per post.
    let nextComment = 0;

    for (const [i, post] of POSTS.entries()) {
        const up = post.up ?? [];
        const down = post.down ?? [];
        const score = up.length - down.length;
        const createdAt = hoursAgo(post.hours);

        const fields = {
            title: post.title,
            content: post.body,
            score,
            createdAt,
            updatedAt: createdAt,
            authorId: userId(post.author),
            communityId: communityId(post.community),
        };

        await prisma.post.upsert({
            where: { id: postId(i) },
            update: fields,
            create: { id: postId(i), ...fields },
        });

        // The vote rows the score above summarizes. Keyed by (post, user), so a re-run updates the
        // same vote rather than failing on the unique constraint.
        for (const [voter, value] of [
            ...up.map((u) => [u, 1] as const),
            ...down.map((d) => [d, -1] as const),
        ]) {
            await prisma.postVote.upsert({
                where: { postId_userId: { postId: postId(i), userId: userId(voter) } },
                update: { value },
                create: { postId: postId(i), userId: userId(voter), value },
            });
        }

        for (const comment of post.comments ?? []) {
            const cUp = comment.up ?? [];
            const cDown = comment.down ?? [];
            const cId = commentId(nextComment++);
            const cCreatedAt = hoursAgo(comment.hours);

            const cFields = {
                content: comment.body,
                score: cUp.length - cDown.length,
                createdAt: cCreatedAt,
                updatedAt: cCreatedAt,
                authorId: userId(comment.author),
                postId: postId(i),
            };

            await prisma.comment.upsert({
                where: { id: cId },
                update: cFields,
                create: { id: cId, ...cFields },
            });

            for (const [voter, value] of [
                ...cUp.map((u) => [u, 1] as const),
                ...cDown.map((d) => [d, -1] as const),
            ]) {
                await prisma.commentVote.upsert({
                    where: { commentId_userId: { commentId: cId, userId: userId(voter) } },
                    update: { value },
                    create: { commentId: cId, userId: userId(voter), value },
                });
            }
        }
    }

    console.log(
        `Seeded ${USERNAMES.length} profiles, ${COMMUNITIES.length} communities, ` +
            `${POSTS.length} posts, and ${nextComment} comments.`,
    );
}

main()
    .catch((error: unknown) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
