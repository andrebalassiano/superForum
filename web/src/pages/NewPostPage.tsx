import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../api';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage } from '../components/states';
import type { Community, Page } from '../types';

// The "new post" form at /submit: pick a community, write a title + content, POST /posts, then jump
// to the created post's page.
function NewPostPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [communityId, setCommunityId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    // Communities to populate the picker. (limit=100 is the backend's cap — plenty here; a huge
    // forum would need a searchable async picker instead.)
    const communitiesQuery = useQuery({
        queryKey: ['communities', 'all'],
        queryFn: () => apiFetch<Page<Community>>('/communities?limit=100'),
    });

    const createPost = useMutation({
        // We only need the new post's id back (to navigate to it), so we type just that.
        mutationFn: () =>
            apiFetch<{ id: string }>('/posts', {
                method: 'POST',
                body: { title, content, communityId },
            }),
        onSuccess: (post) => {
            // Refresh the feed so the new post shows there, then go to its page.
            void queryClient.invalidateQueries({ queryKey: ['posts'] });
            void navigate(`/posts/${post.id}`);
        },
    });

    // Creating requires a signed-in user (the backend would 401 anyway).
    if (!user) {
        return (
            <p className="my-12 text-center text-muted">
                <Link to="/login" className="text-accent no-underline hover:underline">
                    Sign in
                </Link>{' '}
                to create a post.
            </p>
        );
    }

    const canSubmit = title.trim() !== '' && content.trim() !== '' && communityId !== '';

    return (
        <div className="new-post">
            <h1>New post</h1>
            <form
                className="new-post-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canSubmit) createPost.mutate();
                }}
            >
                <label>
                    Community
                    <select
                        value={communityId}
                        onChange={(e) => setCommunityId(e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            {communitiesQuery.isPending ? 'Loading...' : 'Choose a community'}
                        </option>
                        {communitiesQuery.data?.items.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Title
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Content
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        required
                    />
                </label>

                {createPost.isError && <ErrorMessage>{createPost.error.message}</ErrorMessage>}

                <button type="submit" disabled={!canSubmit || createPost.isPending}>
                    {createPost.isPending ? 'Posting...' : 'Create post'}
                </button>
            </form>
        </div>
    );
}

export default NewPostPage;
