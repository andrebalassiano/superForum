import CommentsRepository from './comments.repository';
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

        return await CommentsRepository.create(data);
    },

    // simple read passthrough — kept here so the controller never talks to the repository directly
    async getCommentById(id: string) {
        return await CommentsRepository.findById({ id });
    },

    // list every comment on a given post; pagination/sorting can layer in later
    async getCommentsByPostId(postId: string) {
        return await CommentsRepository.findByPostId(postId);
    },

    // build the update payload from only the fields that were sent (PATCH semantics)
    async updateComment(id: string, dto: UpdateCommentDTO) {
        const data: Prisma.CommentUpdateInput = {};

        if (dto.content !== undefined) {
            data.content = dto.content;
        }

        // P2025 = "record not found" — catch it and return null so the controller can map to a 404
        try {
            return await CommentsRepository.updateById({ id }, data);
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
            return await CommentsRepository.deleteById({ id });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
    },
};


export default commentsService;
