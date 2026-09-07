import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';

function LoginPage() {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate(); // lets us redirect in code (after a successful sign-in)

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit() {
        setError(null);
        setSubmitting(true);
        try {
            if (mode === 'signin') {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
            navigate('/'); // success → back to the feed
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="auth">
            <h1>{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>

            {/* Controlled inputs: React state is the single source of truth. `value` reads from
                state, `onChange` writes back to it — so what's on screen always matches `email`.
                The inline handler stops the browser's default full-page submit, then runs our async
                submit (void marks the promise as intentionally not awaited here). */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
                className="auth-form"
            >
                <label>
                    Email
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                <label>
                    Password
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                {error && <p className="auth-error">{error}</p>}

                <button type="submit" disabled={submitting}>
                    {submitting ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
            </form>

            <button
                type="button"
                className="auth-toggle"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
                {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </button>
        </div>
    );
}

export default LoginPage;
