import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';
import { PaginationQueryDTO } from '../../core/pagination';

const commentsRepository = {
    async create(data: Prisma.CommentCreateInput) {
        return prisma.comment.create({
            data,
        });
    },

    // Mirror of posts.repository pattern: when userId is supplied, attach the caller's vote on
    // this comment via a filtered include. @@unique([commentId, userId]) guarantees 0 or 1 votes.
    async findById(where: Prisma.CommentWhereUniqueInput, userId?: string) {
        return prisma.comment.findUnique({
            where,
            include: {
                author: { select: { username: true } },
                ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
            },
        });
    },

    // Same userId-filtered include for the thread-by-post listing — one query, no N+1.
    // Cursor-paginated like posts.findAll: (createdAt desc, id desc) ordering with a limit+1 take,
    // seeking past the cursor row when one is supplied.
    async findByPostId(postId: string, userId: string | undefined, pagination: PaginationQueryDTO) {
        const { limit, cursor } = pagination;
        return prisma.comment.findMany({
            where: {
                postId: postId,
            },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: { username: true } },
                ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
    },

    // One author's comments, newest first — the comments tab of a profile. Same cursor pagination
    // and same userId-filtered vote include as findByPostId, with one addition: each row carries its
    // parent post's id and title. A comment shown outside its thread is meaningless, so the client
    // needs somewhere to link to and something to label the link with. Only those two columns, not
    // the whole post, because the body is not rendered here.
    async findByAuthorId(
        authorId: string,
        userId: string | undefined,
        pagination: PaginationQueryDTO,
    ) {
        const { limit, cursor } = pagination;
        return prisma.comment.findMany({
            where: {
                authorId,
            },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                author: { select: { username: true } },
                post: { select: { id: true, title: true } },
                ...(userId ? { votes: { where: { userId }, select: { value: true } } } : {}),
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
    },

    async updateById(where: Prisma.CommentWhereUniqueInput, data: Prisma.CommentUpdateInput) {
        return prisma.comment.update({
            where,
            data,
        });
    },

    async deleteById(where: Prisma.CommentWhereUniqueInput) {
        return prisma.comment.delete({
            where,
        });
    },
};

export default commentsRepository;
