import { Request, Response } from 'express';
import postsService from './posts.service';

// start from a CRUD perspective here and go further 

const postsController = {
    async getPosts(req:Request, res:Response) {
        try {

            const posts = postsService.getAllPosts;  // 
            res.status(200).json(posts);

        } catch (error) {

            console.error(error);
            res.status(500).json({ message: "Failed to fetch posts"});

        }
        

    },



    async createPost(req:Request, res:Response) {
        
    }


}


export default postsController;