import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import App from './App.tsx';

// One QueryClient holds the query cache for the whole app. Created once, outside the component tree,
// so it isn't recreated on every render.
const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* QueryClientProvider makes that cache available to every useQuery beneath it. */}
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
            {/* A floating, dev-only panel for inspecting the cache — query states, staleness, and
                refetches. It's excluded from production builds automatically. */}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    </StrictMode>,
);
