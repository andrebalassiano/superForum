// The Prisma 7 pg adapter trips node-postgres' "client.query() when the client is already
// executing a query is deprecated" warning during ordinary query execution. It's benign and
// internal to the adapter — nothing in this codebase issues concurrent queries on one connection
// (there's no Promise.all over queries anywhere). Drop just that one message so test output stays
// readable; every other warning still surfaces untouched.
const FLAG = '__pgDeprecationSilenced';
const g = globalThis as Record<string, unknown>;

if (!g[FLAG]) {
    g[FLAG] = true;

    const originalEmit = process.emitWarning.bind(process);
    process.emitWarning = ((warning: string | Error, ...args: unknown[]) => {
        const message = typeof warning === 'string' ? warning : warning?.message ?? '';
        if (message.includes('client.query() when the client is already executing a query')) {
            return;
        }
        return (originalEmit as (...a: unknown[]) => void)(warning, ...args);
    }) as typeof process.emitWarning;
}
