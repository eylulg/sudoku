interface SudokuCell {
  value: number;
  prefilled: boolean;
  error: boolean;
  highlight: boolean;
}

type Difficulty = 'beginner' | 'intermediate' | 'hard' | 'expert' | '';

interface LeaderboardEntry {
  score: number;
}

type Leaderboard = Record<Difficulty, LeaderboardEntry[]>;
