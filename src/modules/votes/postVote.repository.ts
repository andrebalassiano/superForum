import prisma from '../../core/prismaSingleton';

const postVoteRepository = {

    // Upsert the caller's vote AND keep the post's denormalized `score` in sync, atomically.
    // We read the old value first so the score delta is (newValue - oldValue): a fresh +1 adds 1,
    // a switch from +1 to -1 subtracts 2, a repeat of the same value is a no-op. The transaction
    // makes the vote write and the score update all-or-nothing. A missing post makes the connect
    // throw P2025, rolling the whole thing back (the service maps that to a 404).
    async upsertWithScore(postId: string, userId: string, value: number) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.postVote.findUnique({
                where: { postId_userId: { postId, userId } },
                select: { value: true },
            });

            const vote = await tx.postVote.upsert({
                where: { postId_userId: { postId, userId } },
                create: {
                    value,
                    post: { connect: { id: postId } },
                    user: { connect: { id: userId } },
                },
                update: { value },
            });

            const delta = value - (existing?.value ?? 0);
            if (delta !== 0) {
                await tx.post.update({
                    where: { id: postId },
                    data: { score: { increment: delta } },
                });
            }

            return vote;
        });
    },


    // Delete the caller's vote and back its value out of the post's score, atomically.
    // Returns null when there was no vote to remove (the service maps that to a 404).
    async deleteWithScore(postId: string, userId: string) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.postVote.findUnique({
                where: { postId_userId: { postId, userId } },
                select: { value: true },
            });
            if (!existing) {
                return null;
            }

            const vote = await tx.postVote.delete({
                where: { postId_userId: { postId, userId } },
            });

            await tx.post.update({
                where: { id: postId },
                data: { score: { decrement: existing.value } },
            });

            return vote;
        });
    },
};


export default postVoteRepository;