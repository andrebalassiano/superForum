import z from 'zod';

// Query params for cursor-paginated list endpoints. `limit` defaults to 20 and caps at 100;
// `cursor` is the id of the last item from the previous page. z.coerce turns the raw string query
// values into numbers, and .strict() rejects unknown/typo'd query keys with a 400.
export const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.uuid().optional(),
}).strict();

export type PaginationQueryDTO = z.infer<typeof paginationQuerySchema>;

// Repositories fetch `limit + 1` rows so we can tell whether another page exists without a second
// query. This splits that peeked row back off: `items` is the page (<= limit) and `nextCursor` is
// the last item's id, or null when this was the final page.
export function buildPage<T extends { id: string }>(rows: T[], limit: number) {
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;
    return { items, nextCursor };
}
