import postsRepository from "./posts.repository";

const postsService = {
    async getAllPosts() {
        const posts = postsRepository.findAll();
        // this case is just a pipe, but other functions will have more logic.

        return posts;
    },


    async createPost(data:object) {

    }

    

}


export default postsService;