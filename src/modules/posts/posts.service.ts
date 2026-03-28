import PostsRepository from './posts.repository';
import { CreatePostDTO, UpdatePostDTO } from './posts.schemas';
import { Prisma } from '../../generated/prisma/client';
import { randomUUID } from 'crypto';
import z from 'zod';

const PostsService = {

    async getAllPosts() {
        const posts = await PostsRepository.findAll();
        // this case is just a pipe, but other functions will have more logic.

        return posts;
        // fine for now, may feature .map functionality later, such as pagination,
        // sorting, filtering, caching.
    },


    async createPost(dto: CreatePostDTO) {
        const data: Prisma.PostCreateInput = {
            title: dto.title,
            link: `post/${randomUUID()}`,
            content: dto.content,
            timestamp: dto.timestamp,
            author: {
                connect: {
                    id: dto.authorId,
                }
            },
            subreddit: {
                connect: {
                    id: dto.subredditId,
                }
            },            
        }

        return await PostsRepository.create(data);
    },

    async getPostsBySubreddit(subredditId: string) {
        
        return await PostsRepository.findBySubredditId(subredditId);
    },


    async getPostById(postId: string) {

        return await PostsRepository.findById({ id: postId });
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
            return await PostsRepository.updateById({ id: postId }, data);

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
            return await PostsRepository.deleteById({ id: postId});
        
        } catch (error) {

            if(error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025') {
                    
                return null;
            }

            throw error;
        }
    },
}


export default PostsService;