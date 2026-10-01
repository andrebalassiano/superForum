import profilesRepository from './profiles.repository';

const profilesService = {
    // Returns null for an unknown username so the controller can answer 404.
    //
    // `reputation` is the one derived field: net votes received on posts, on comments, and the sum.
    // Shaped as an object rather than two flat fields so the client reads one thing, and named
    // reputation rather than score because `score` already means a single post's or comment's net
    // votes — reusing it here would make `score` ambiguous in both the code and the JSON.
    async getProfileByUsername(username: string) {
        const profile = await profilesRepository.findByUsername(username);
        if (!profile) {
            return null;
        }

        const sums = await profilesRepository.sumScoresByAuthorId(profile.id);

        // _sum is null, not 0, when the profile has written nothing — coalesce so a brand-new
        // account reports 0 rather than null.
        const posts = sums.posts ?? 0;
        const comments = sums.comments ?? 0;

        return {
            ...profile,
            reputation: {
                posts,
                comments,
                total: posts + comments,
            },
        };
    },
};

export default profilesService;
