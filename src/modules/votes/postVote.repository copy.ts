import prisma from '../../core/prismaSingleton';
import { Prisma } from '../../generated/prisma/client';

const PostVoteRepository = {
    async create(data:Prisma.PostVoteCreateInput) {
        return prisma.postVote.create({
            data,
        })
    },


    async findById(where:Prisma.PostVoteWhereUniqueInput) {
        return prisma.postVote.findUnique({
            where,
        });
    },


    async findByPost(postId:string) {
        return prisma.postVote.findMany({
            where: {
                postId: postId,
            }
        });
    },


    async updateById(where:Prisma.PostVoteWhereUniqueInput, 
                     data:Prisma.PostVoteUpdateInput) {
        return prisma.postVote.update({
            where,
            data,
        });
    },


    async deleteById(where:Prisma.PostVoteWhereUniqueInput) {
        return prisma.postVote.delete({
            where,
        });
    },

};


export default PostVoteRepository;