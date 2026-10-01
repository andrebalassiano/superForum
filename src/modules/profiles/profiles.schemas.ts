import z from 'zod';

// Params for every /profiles/:username route. Usernames are free-form (createProfileSchema only
// trims and requires a character), so there is no pattern to assert here — just that something was
// supplied. Exported rather than kept local because the two nested feed routes live in the posts and
// comments modules, and all three have to validate the same param the same way.
export const usernameParamsSchema = z.object({
    username: z.string().trim().min(1),
});

export type UsernameParamsDTO = z.infer<typeof usernameParamsSchema>;
