import { computed, defineComponent } from 'vue';

import { leaderboard } from '@/stores/leaderboard';

import { formatDifficulty } from '@/utils/sudokuPuzzle';

import '@/styles/leaderboard.css';

const Leaderboard = defineComponent({
  name: 'Leaderboard',
  setup() {
    const filteredEntries = computed(() => {
      return Object.entries(leaderboard.value).filter(([_, scores]) => scores.length > 0);
    });

    return () => (
      <div class='leaderboard'>
        <h2>Leaderboard</h2>
        <>
          {filteredEntries.value.length > 0 ? (
            filteredEntries.value.map(([difficulty, scores]) => (
              <div key={difficulty} class='leaderboard-section'>
                <h3>{formatDifficulty(difficulty)}</h3>
                <ol>
                  {scores.map((entry, index) => (
                    <li key={`${difficulty}-${index}`}>{entry.score}</li>
                  ))}
                </ol>
              </div>
            ))
          ) : (
            <p>No scores yet.</p>
          )}
        </>
      </div>
    );
  },
});

export default Leaderboard;
