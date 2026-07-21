import postsRepository from './posts.repository';
import { CreatePostDTO, UpdatePostDTO } from './posts.schemas';
import { Prisma } from '../../generated/prisma/client';
import z from 'zod';

const postsService = {

    // userId is optional — passed in by the controller as req.user?.id (undefined for anonymous).
    // When provided, the repo includes the caller's vote on each post; we strip the raw `votes`
    // array and surface it as `currentUserVote: 1 | -1 | null` so the client never sees the
    // include shape and can render arrow state on first paint.
    async getAllPosts(userId?: string) {
        const posts = await postsRepository.findAll(userId);

        return posts.map((post) => {
            const { votes, ...rest } = post as typeof post & { votes?: { value: number }[] };
            return { ...rest, currentUserVote: votes?.[0]?.value ?? null };
        });
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
            community: {
                connect: {
                    id: dto.communityId,
                }
            },
        }

        return await postsRepository.create(data);
    },

    async getPostsByCommunity(communityId: string) {

        return await postsRepository.findByCommunityId(communityId);
    },


    // Mirror of getAllPosts for a single post — same userId-through pattern, same reshape.
    async getPostById(postId: string, userId?: string) {
        const post = await postsRepository.findById({ id: postId }, userId);
        if (!post) return null;

        const { votes, ...rest } = post as typeof post & { votes?: { value: number }[] };
        return { ...rest, currentUserVote: votes?.[0]?.value ?? null };
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