import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';


const CommentsRepository = {

    async create(data:Prisma.CommentCreateInput) {
        return prisma.comment.create({
            data,
        });
    },

    async findById(where:Prisma.CommentWhereUniqueInput) {
        return prisma.comment.findUnique({
            where,
        });
    },

    async findByPostId(postId:string) {
        return prisma.comment.findMany({
            where: {
                postId: postId,
            }
        });
    },

    async updateById(where:Prisma.CommentWhereUniqueInput, 
                    data:Prisma.CommentUpdateInput) {
        return prisma.comment.update({
            where,
            data,
        });
    },

    async deleteById(where:Prisma.CommentWhereUniqueInput) {
        return prisma.comment.delete({
            where,
        })
    },

};


export default CommentsRepository;
