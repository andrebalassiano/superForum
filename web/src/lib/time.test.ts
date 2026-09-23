import { describe, it, expect, vi, afterEach } from 'vitest';
import { timeAgo } from './time';

// timeAgo reads Date.now(), so a real clock would make these tests depend on when they run. Faking
// the clock pins "now" to a fixed instant; each case then builds its input by subtracting from it.
const NOW = new Date('2026-09-22T12:00:00Z');

function isoAgo(ms: number) {
    return new Date(NOW.getTime() - ms).toISOString();
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

afterEach(() => vi.useRealTimers());

describe('timeAgo', () => {
    it('formats each unit it steps through', () => {
        vi.useFakeTimers({ now: NOW });

        expect(timeAgo(isoAgo(5 * SECOND))).toBe('just now');
        expect(timeAgo(isoAgo(3 * MINUTE))).toBe('3m ago');
        expect(timeAgo(isoAgo(5 * HOUR))).toBe('5h ago');
        expect(timeAgo(isoAgo(2 * DAY))).toBe('2d ago');
        expect(timeAgo(isoAgo(45 * DAY))).toBe('1mo ago');
        expect(timeAgo(isoAgo(400 * DAY))).toBe('1y ago');
    });

    // The boundaries are where an off-by-one would hide: 59s is still "just now", 60s is a minute.
    it('switches unit exactly at each boundary', () => {
        vi.useFakeTimers({ now: NOW });

        expect(timeAgo(isoAgo(59 * SECOND))).toBe('just now');
        expect(timeAgo(isoAgo(60 * SECOND))).toBe('1m ago');
        expect(timeAgo(isoAgo(59 * MINUTE))).toBe('59m ago');
        expect(timeAgo(isoAgo(60 * MINUTE))).toBe('1h ago');
        expect(timeAgo(isoAgo(23 * HOUR))).toBe('23h ago');
        expect(timeAgo(isoAgo(24 * HOUR))).toBe('1d ago');
    });
});
