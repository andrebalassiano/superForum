import prisma from '../../core/prismaSingleton';

const commentVoteRepository = {
    // Mirror of postVoteRepository.upsertWithScore — upsert the vote and keep the comment's
    // denormalized `score` in sync atomically, using the (newValue - oldValue) delta.
    async upsertWithScore(commentId: string, userId: string, value: number) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.commentVote.findUnique({
                where: { commentId_userId: { commentId, userId } },
                select: { value: true },
            });

            const vote = await tx.commentVote.upsert({
                where: { commentId_userId: { commentId, userId } },
                create: {
                    value,
                    comment: { connect: { id: commentId } },
                    user: { connect: { id: userId } },
                },
                update: { value },
            });

            const delta = value - (existing?.value ?? 0);
            if (delta !== 0) {
                await tx.comment.update({
                    where: { id: commentId },
                    data: { score: { increment: delta } },
                });
            }

            return vote;
        });
    },

    // Mirror of postVoteRepository.deleteWithScore — returns null when there was no vote to remove.
    async deleteWithScore(commentId: string, userId: string) {
        return prisma.$transaction(async (tx) => {
            const existing = await tx.commentVote.findUnique({
                where: { commentId_userId: { commentId, userId } },
                select: { value: true },
            });
            if (!existing) {
                return null;
            }

            const vote = await tx.commentVote.delete({
                where: { commentId_userId: { commentId, userId } },
            });

            await tx.comment.update({
                where: { id: commentId },
                data: { score: { decrement: existing.value } },
            });

            return vote;
        });
    },
};

export default commentVoteRepository;
