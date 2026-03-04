import prisma from '../../core/db/prisma';  // solve the "Cannot find module" issue. You'll have to run some console commands. 

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