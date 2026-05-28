import postsRepository from './posts.repository';
import { CreatePostDTO, UpdatePostDTO } from './posts.schemas';
import { Prisma } from '../../generated/prisma/client';
import z from 'zod';

const postsService = {

    async getAllPosts() {
        const posts = await postsRepository.findAll();
        // this case is just a pipe, but other functions will have more logic.

        return posts;
        // fine for now, may feature .map functionality later, such as pagination,
        // sorting, filtering, caching.
    },


    // authorId now comes from the authenticated caller (req.user.id), not the request body
    async createPost(authorId: string, dto: CreatePostDTO) {
        const data: Prisma.PostCreateInput = {
            title: dto.title,
            content: dto.content,
            timestamp: dto.timestamp,
            author: {
                connect: {
                    id: authorId,
                }
            },
            subreddit: {
                connect: {
                    id: dto.subredditId,
                }
            },
        }

        return await postsRepository.create(data);
    },

    async getPostsBySubreddit(subredditId: string) {
        
        return await postsRepository.findBySubredditId(subredditId);
    },


    async getPostById(postId: string) {

        return await postsRepository.findById({ id: postId });
    },



    async updatePost(postId: string, dto: UpdatePostDTO) {
        const data: Prisma.PostUpdateInput = {};

        if (dto.title !== undefined) {
            data.title = dto.title;
        }

        if (dto.content !== undefined) {
            data.content = dto.content;
        }

        try {
            return await postsRepository.updateById({ id: postId }, data);

        } catch (error) {

            if(error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {

                return null;
            }
            
            throw error;
        }
    },



    async deletePost(postId: string) {

        try {
            return await postsRepository.deleteById({ id: postId});
        
        } catch (error) {

            if(error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                    
                return null;
            }

            throw error;
        }
    },
}


export default postsService;