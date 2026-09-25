import { InMemoryRateLimiter } from './in-memory-rate-limiter';

describe('InMemoryRateLimiter', () => {
  it('allows up to the limit then blocks', () => {
    const limiter = new InMemoryRateLimiter();
    expect(limiter.attempt('k', 2, 60_000)).toBe(true);
    expect(limiter.attempt('k', 2, 60_000)).toBe(true);
    expect(limiter.attempt('k', 2, 60_000)).toBe(false);
  });

  it('resets after the window', () => {
    jest.useFakeTimers();
    const limiter = new InMemoryRateLimiter();
    expect(limiter.attempt('k2', 1, 1000)).toBe(true);
    expect(limiter.attempt('k2', 1, 1000)).toBe(false);
    jest.advanceTimersByTime(1001);
    expect(limiter.attempt('k2', 1, 60_000)).toBe(true);
    jest.useRealTimers();
  });
});
