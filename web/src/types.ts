// The shape of one post as GET /posts returns it. The backend reshapes each row to fold the raw
// votes array into `currentUserVote`, and includes the author, community, and a comment count — so
// the UI can render a card without extra requests. We type only the fields the UI actually reads.
//
// Note dates arrive as strings: JSON has no Date type, so `createdAt` is the ISO string Prisma's
// Date was serialized to.
export interface Post {
    id: string;
    title: string;
    content: string;
    score: number;
    createdAt: string;
    // The author's Supabase user id, which is also their Profile id. The API has always returned it;
    // the UI needs it to decide whether to offer edit and delete. The server enforces the same rule
    // independently — this only controls what's shown.
    authorId: string;
    author: { username: string };
    community: { id: string; name: string };
    _count: { comments: number };
    currentUserVote: number | null;
}

// One comment as GET /posts/:postId/comments returns it. Like posts, the backend folds the caller's
// vote into currentUserVote and (as of the 9b backend tweak) includes the author's username.
export interface Comment {
    id: string;
    content: string;
    score: number;
    createdAt: string;
    authorId: string;
    author: { username: string };
    currentUserVote: number | null;
}

// The caller's own profile, as GET /auth/me returns it. Its id IS the Supabase user id — the row
// that links an authenticated identity to everything they write. Signing up with Supabase does not
// create it; POST /auth/profile does.
export interface Profile {
    id: string;
    username: string;
}

// A community, as GET /communities returns it — just what the "new post" picker needs.
export interface Community {
    id: string;
    name: string;
}

// The cursor-pagination envelope every list endpoint returns. Generic so it works for any row type:
// `Page<Post>` is { items: Post[]; nextCursor: string | null }, `Page<Comment>` likewise.
export interface Page<T> {
    items: T[];
    nextCursor: string | null;
}
