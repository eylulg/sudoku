import { DIFFICULTIES } from '@/constants/sudoku';

const initializeLeaderboard = (): Leaderboard => {
  const leaderboard: Partial<Leaderboard> = {};

  DIFFICULTIES.forEach((difficulty) => {
    leaderboard[difficulty] = [];
  });

  return leaderboard as Leaderboard;
};

export const getLeaderboard = (): Leaderboard => {
  const leaderboard = localStorage.getItem('leaderboard');
  return leaderboard ? JSON.parse(leaderboard) : initializeLeaderboard();
};

export const saveLeaderboard = (leaderboard: Leaderboard) => {
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
};
