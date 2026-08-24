// The one place the backend's base URL lives, so pages don't each hardcode it. Still a literal for
// now; a later step moves it to a Vite env var (import.meta.env) so dev and production can differ.
export const API_URL = 'http://localhost:3000/api';
