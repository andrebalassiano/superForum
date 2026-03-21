import PostsRepository from './posts.repository';
import { CreatePostDTO, UpdatePostDTO } from './posts.schemas';
import { Prisma } from '../../generated/prisma/client';
import { randomUUID } from 'crypto';
import z from 'zod';

const PostsService = {

    async getAllPosts() {
        const posts = PostsRepository.findAll();
        // this case is just a pipe, but other functions will have more logic.

        return posts;
    },


    async createPost(dto:CreatePostDTO) {
        const data:Prisma.PostCreateInput = {
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

        return PostsRepository.create(data);
    },

    async getPostsBySubreddit(subredditId:string) {
        

        return PostsRepository.findBySubredditId(subredditId)
    },

    async updatePost(postId:string, dto:UpdatePostDTO) {
        const data:Prisma.PostUpdateInput = {
            title: dto.title,
            content: dto.content,
        }

        return PostsRepository.updateById({id: postId}, data);
    },

    async deletePost(postId:string) {
        return PostsRepository.deleteById;
    },
}


export default PostsService;