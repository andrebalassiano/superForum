import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

describe('health: GET /api/health', () => {
    it('returns 200 with status ok when the database answers', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});
