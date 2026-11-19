import { DIFFICULTIES } from '@/constants/sudoku';

export const LEADERBOARD_STORAGE_KEY = 'leaderboard';

export const initializeLeaderboard = (): Leaderboard => {
  const leaderboard: Partial<Leaderboard> = {};

  DIFFICULTIES.forEach((difficulty) => {
    leaderboard[difficulty] = [];
  });

  return leaderboard as Leaderboard;
};

const isEntryList = (value: unknown): value is LeaderboardEntry[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      typeof (entry as LeaderboardEntry).score === 'number' &&
      Number.isFinite((entry as LeaderboardEntry).score),
  );

/**
 * Reads the leaderboard from localStorage. Missing, unreadable or malformed
 * data falls back to an empty leaderboard instead of breaking the app.
 */
export const getLeaderboard = (): Leaderboard => {
  const leaderboard = initializeLeaderboard();

  try {
    const stored = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!stored) return leaderboard;

    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed !== 'object' || parsed === null) return leaderboard;

    DIFFICULTIES.forEach((difficulty) => {
      const entries = (parsed as Record<string, unknown>)[difficulty];
      if (isEntryList(entries)) leaderboard[difficulty] = entries;
    });
  } catch {
    // Fall through to the empty leaderboard.
  }

  return leaderboard;
};

export const saveLeaderboard = (leaderboard: Leaderboard) => {
  try {
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    // Storage can be full or blocked; the in-memory leaderboard still works.
  }
};
