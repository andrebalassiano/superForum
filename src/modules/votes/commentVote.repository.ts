import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const commentVoteRepository = {

    async create(data:Prisma.CommentVoteCreateInput) {
        return prisma.commentVote.create({
            data,
        });
    },


    async findById(where:Prisma.CommentVoteWhereUniqueInput) {
        return prisma.commentVote.findUnique({
            where,
        });
    },


    async findByComment(commentId:string) {
        return prisma.commentVote.findMany({
            where: {
                commentId: commentId,
            }
        });
    },


    async updateById(where:Prisma.CommentVoteWhereUniqueInput,
                     data:Prisma.CommentVoteUpdateInput) {
        return prisma.commentVote.update({
            where,
            data,
        });
    },


    // create-if-missing-or-update — one atomic statement, no race condition on rapid double-clicks
    async upsert(where:Prisma.CommentVoteWhereUniqueInput,
                 create:Prisma.CommentVoteCreateInput,
                 update:Prisma.CommentVoteUpdateInput) {
        return prisma.commentVote.upsert({
            where,
            create,
            update,
        });
    },


    async deleteById(where:Prisma.CommentVoteWhereUniqueInput) {
        return prisma.commentVote.delete({
            where,
        })
    }
};


export default commentVoteRepository;