import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const CommentVoteRepository = {

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


    async deleteById(where:Prisma.CommentVoteWhereUniqueInput) {
        return prisma.commentVote.delete({
            where,
        })
    }
};


export default CommentVoteRepository;