import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        {/* BrowserRouter switches on client-side routing for everything inside it: it watches the
            browser URL and makes <Routes> and <Link> work. It wraps the whole app so any component
            can read the current route or navigate. */}
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
