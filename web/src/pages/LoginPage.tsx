import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import { Field, inputClasses } from '../components/forms';
import { ErrorMessage } from '../components/states';

function LoginPage() {
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate(); // lets us redirect in code (after a successful sign-in)

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
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
                await signUp(email, password, username);
            }
            navigate('/'); // success → back to the feed
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto my-8 max-w-sm">
            <h1 className="mb-4 text-2xl font-semibold">
                {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h1>

            {/* Controlled inputs: React state is the single source of truth. `value` reads from
                state, `onChange` writes back to it. The inline handler stops the browser's default
                full-page submit, then runs our async submit. autoComplete tells browsers and
                password managers which field is which. */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    void handleSubmit();
                }}
                className="flex flex-col gap-3"
            >
                <Field label="Email">
                    <input
                        type="email"
                        className={inputClasses}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </Field>
                {/* Sign-up only: the public name on every post and comment. The backend trims it,
                    requires at least one character, and answers 409 if it's taken. */}
                {mode === 'signup' && (
                    <Field label="Username">
                        <input
                            type="text"
                            className={inputClasses}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="username"
                            required
                        />
                    </Field>
                )}

                <Field label="Password">
                    <input
                        type="password"
                        className={inputClasses}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                        required
                    />
                </Field>

                {error && <ErrorMessage>{error}</ErrorMessage>}

                <Button type="submit" disabled={submitting} className="self-start">
                    {submitting ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
                </Button>
            </form>

            <Button
                type="button"
                variant="ghost"
                className="mt-3 px-0"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
                {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </Button>
        </div>
    );
}

export default LoginPage;
