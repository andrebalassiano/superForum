import commentsRepository from './comments.repository';
import { Prisma } from '../../generated/prisma/client';
import { CreateCommentDTO, UpdateCommentDTO } from './comments.schemas';


const commentsService = {

    // authorId comes from the authenticated caller (req.user.id), not the request body —
    // same impersonation-prevention pattern we applied to posts.
    async createComment(authorId: string, dto: CreateCommentDTO) {
        const data: Prisma.CommentCreateInput = {
            content: dto.content,
            timestamp: dto.timestamp,
            author: {
                connect: {
                    id: authorId,
                },
            },
            post: {
                connect: {
                    id: dto.postId,
                },
            },
        };

        return await commentsRepository.create(data);
    },

    // userId is optional (req.user?.id from optionalAuth). When provided, the repo includes the
    // caller's vote on this comment; we strip the raw `votes` array and surface it as
    // `currentUserVote: 1 | -1 | null` so the client doesn't see the include shape.
    async getCommentById(id: string, userId?: string) {
        const comment = await commentsRepository.findById({ id }, userId);
        if (!comment) return null;

        const { votes, ...rest } = comment as typeof comment & { votes?: { value: number }[] };
        return { ...rest, currentUserVote: votes?.[0]?.value ?? null };
    },

    // Same reshape, applied to every comment in the thread — single round-trip, all arrow states
    // ready for the client to render on first paint.
    async getCommentsByPostId(postId: string, userId?: string) {
        const comments = await commentsRepository.findByPostId(postId, userId);

        return comments.map((comment) => {
            const { votes, ...rest } = comment as typeof comment & { votes?: { value: number }[] };
            return { ...rest, currentUserVote: votes?.[0]?.value ?? null };
        });
    },

    // build the update payload from only the fields that were sent (PATCH semantics)
    async updateComment(id: string, dto: UpdateCommentDTO) {
        const data: Prisma.CommentUpdateInput = {};

        if (dto.content !== undefined) {
            data.content = dto.content;
        }

        // P2025 = "record not found" — catch it and return null so the controller can map to a 404
        try {
            return await commentsRepository.updateById({ id }, data);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },

    // same P2025 trick — delete throws if the row doesn't exist
    async deleteComment(id: string) {
        try {
            return await commentsRepository.deleteById({ id });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },
};


export default commentsService;
