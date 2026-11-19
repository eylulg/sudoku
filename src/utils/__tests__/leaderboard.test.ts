import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LEADERBOARD_STORAGE_KEY,
  getLeaderboard,
  initializeLeaderboard,
  saveLeaderboard,
} from '@/utils/leaderboard';

const empty = { beginner: [], intermediate: [], hard: [], expert: [] };

describe('leaderboard utils', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with an empty list for every difficulty', () => {
    expect(initializeLeaderboard()).toEqual(empty);
    expect(getLeaderboard()).toEqual(empty);
  });

  it('round trips through localStorage', () => {
    const leaderboard = {
      ...initializeLeaderboard(),
      hard: [{ score: 420 }, { score: 300 }],
    };
    saveLeaderboard(leaderboard);
    expect(JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY)!)).toEqual(
      leaderboard,
    );
    expect(getLeaderboard()).toEqual(leaderboard);
  });

  it('ignores invalid JSON', () => {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, '{oops');
    expect(getLeaderboard()).toEqual(empty);
  });

  it('keeps valid difficulties and drops malformed ones', () => {
    localStorage.setItem(
      LEADERBOARD_STORAGE_KEY,
      JSON.stringify({
        beginner: [{ score: 10 }],
        hard: 'not a list',
        expert: [{ score: 'high' }],
        unknown: [{ score: 1 }],
      }),
    );
    expect(getLeaderboard()).toEqual({ ...empty, beginner: [{ score: 10 }] });
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(getLeaderboard()).toEqual(empty);
    expect(() => saveLeaderboard(initializeLeaderboard())).not.toThrow();
  });
});
