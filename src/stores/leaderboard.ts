import { ref } from 'vue';

import { getLeaderboard, saveLeaderboard } from '@/utils/leaderboard';

export const leaderboard = ref(getLeaderboard());

export const saveScoreToLeaderboard = (
  score: number,
  difficulty: Difficulty,
) => {
  if (difficulty === '') return;

  const currentLeaderboard = leaderboard.value;

  currentLeaderboard[difficulty].push({ score });
  currentLeaderboard[difficulty] = currentLeaderboard[difficulty]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  saveLeaderboard(currentLeaderboard);
  leaderboard.value = { ...currentLeaderboard };
};
