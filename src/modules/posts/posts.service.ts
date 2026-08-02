import postsRepository from './posts.repository';
import authRepository from '../auth/auth.repository';
import { CreatePostDTO, UpdatePostDTO } from './posts.schemas';
import { Prisma } from '../../generated/prisma/client';


// Returned by update/delete when the caller isn't the post's author — the controller maps it to 403.
// Distinct from null, which means "no such post" → 404.
export const FORBIDDEN = 'FORBIDDEN' as const;

// Returned by createPost when the caller's Profile row doesn't exist yet — they authenticated with
// Supabase but never ran POST /auth/profile. Lets the controller answer precisely instead of a
// misleading "Community not found" (the author connect would also throw P2025).
export const PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND' as const;

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
        // Pre-check the caller's Profile so a missing profile returns a precise 404 instead of
        // masquerading as "Community not found" — the author connect below would also throw P2025.
        // The community's existence is still checked atomically by the connect.
        const profile = await authRepository.findProfileById(authorId);
        if (!profile) {
            return PROFILE_NOT_FOUND;
        }

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

        // A P2025 here means a connected record didn't exist. The only client-supplied reference is
        // communityId (authorId comes from the verified token), so surface it as a 404 the client can fix.
        try {
            return await postsRepository.create(data);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
                return null;
            }
            throw error;
        }
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



    async updatePost(postId: string, userId: string, dto: UpdatePostDTO) {
        // Ownership gate: only the author may edit. Fetch first so we can distinguish
        // "no such post" (null → 404) from "not yours" (FORBIDDEN → 403).
        const existing = await postsRepository.findById({ id: postId });
        if (!existing) {
            return null;
        }
        if (existing.authorId !== userId) {
            return FORBIDDEN;
        }

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



    async deletePost(postId: string, userId: string) {
        // Same ownership gate as updatePost.
        const existing = await postsRepository.findById({ id: postId });
        if (!existing) {
            return null;
        }
        if (existing.authorId !== userId) {
            return FORBIDDEN;
        }

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