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
    author: { username: string };
    community: { id: string; name: string };
    _count: { comments: number };
    currentUserVote: number | null;
}
