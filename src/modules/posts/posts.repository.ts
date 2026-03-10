import prisma from '../../core/prismaSingleton';

const postsRepository = {
    async findAll() {
        return prisma.post.findMany({
            include: {
                author: true,
                subreddit: true,
                comments: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });
    },

    async createPost() {

    },

    async deletePost() {

    },

    async updatePost() {

    }


}


export default postsRepository;