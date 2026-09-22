import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import { Field, inputClasses } from '../components/forms';
import { ErrorMessage } from '../components/states';
import type { Community } from '../types';

// The "new community" form at /communities/new: one name field, POST /communities, then jump to the
// new community's page. Reached from the Communities page, or from the "new post" form when the
// community someone wants doesn't exist yet — in that case (?then=post) we send them back to the
// post form with the new community already picked, so they don't lose their place.
function NewCommunityPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const cameFromPostForm = searchParams.get('then') === 'post';

    const [name, setName] = useState('');

    const createCommunity = useMutation({
        mutationFn: () => apiFetch<Community>('/communities', { method: 'POST', body: { name } }),
        onSuccess: (community) => {
            // ['communities'] is a prefix match, so this refreshes both the browse list (keyed
            // ['communities']) and the post form's picker (keyed ['communities', 'all']).
            void queryClient.invalidateQueries({ queryKey: ['communities'] });
            void navigate(
                cameFromPostForm
                    ? `/submit?community=${community.id}`
                    : `/communities/${community.id}`,
            );
        },
    });

    if (!user) {
        return (
            <p className="my-12 text-center text-muted">
                <Link to="/login" className="text-accent no-underline hover:underline">
                    Sign in
                </Link>{' '}
                to create a community.
            </p>
        );
    }

    const canSubmit = name.trim() !== '';

    return (
        <div className="py-6">
            <h1 className="mb-4 text-2xl font-semibold">New community</h1>
            <form
                className="flex flex-col gap-3"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSubmit) createCommunity.mutate();
                }}
            >
                <Field label="Name">
                    <input
                        type="text"
                        className={inputClasses}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        required
                    />
                </Field>

                {/* A taken name comes back as a 409 whose message apiFetch surfaces verbatim. */}
                {createCommunity.isError && (
                    <ErrorMessage>{createCommunity.error.message}</ErrorMessage>
                )}

                <Button
                    type="submit"
                    disabled={!canSubmit || createCommunity.isPending}
                    className="self-start"
                >
                    {createCommunity.isPending ? 'Creating...' : 'Create community'}
                </Button>
            </form>
        </div>
    );
}

export default NewCommunityPage;
