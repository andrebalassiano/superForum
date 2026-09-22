import app from './app';

// Hosts (Render, Railway, Fly) assign the port at runtime via PORT; fall back to 3000 locally.
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
