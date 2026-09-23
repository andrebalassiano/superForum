import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../auth/useProfile';
import Button from '../components/Button';
import { Field, inputClasses } from '../components/forms';
import { ErrorMessage } from '../components/states';
import type { Profile } from '../types';

// Picks a username for a signed-in account that has no Profile row yet. Sign-up normally creates
// one straight away, so this is the recovery path: accounts made before that existed, and sign-ups
// where the profile call didn't go through (email confirmation, a dropped request, a taken name).
function WelcomePage() {
    const { user } = useAuth();
    const profileQuery = useProfile();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [username, setUsername] = useState('');

    const createProfile = useMutation({
        mutationFn: () =>
            apiFetch<Profile>('/auth/profile', { method: 'POST', body: { username } }),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['profile'] });
            void navigate('/');
        },
    });

    if (!user) {
        return (
            <p className="my-12 text-center text-muted">
                <Link to="/login" className="text-accent no-underline hover:underline">
                    Sign in
                </Link>{' '}
                to set up your account.
            </p>
        );
    }

    // Already sorted — don't offer a second username.
    if (profileQuery.data) {
        return (
            <p className="my-12 text-center text-muted">
                You're all set as{' '}
                <strong className="text-heading">{profileQuery.data.username}</strong>.{' '}
                <Link to="/" className="text-accent no-underline hover:underline">
                    Go to the feed
                </Link>
                .
            </p>
        );
    }

    const canSubmit = username.trim() !== '';

    return (
        <div className="mx-auto my-8 max-w-sm">
            <h1 className="mb-2 text-2xl font-semibold">Choose a username</h1>
            <p className="mb-4 text-sm text-muted">
                This is the name shown on your posts and comments. You need one before you can post,
                comment, or vote.
            </p>

            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSubmit) createProfile.mutate();
                }}
            >
                <Field label="Username">
                    <input
                        type="text"
                        className={inputClasses}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        autoFocus
                        required
                    />
                </Field>

                {/* A taken username comes back as a 409 the backend words for us. */}
                {createProfile.isError && (
                    <ErrorMessage>{createProfile.error.message}</ErrorMessage>
                )}

                <Button
                    type="submit"
                    disabled={!canSubmit || createProfile.isPending}
                    className="self-start"
                >
                    {createProfile.isPending ? 'Saving...' : 'Continue'}
                </Button>
            </form>
        </div>
    );
}

export default WelcomePage;
