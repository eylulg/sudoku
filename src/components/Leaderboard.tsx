import { computed, defineComponent } from 'vue';

import { leaderboard } from '@/stores/leaderboard';

import '@/styles/leaderboard.css';

const Leaderboard = defineComponent({
  name: 'Leaderboard',
  setup() {
    const filteredEntries = computed(() => {
      return Object.entries(leaderboard.value).filter(
        ([_, scores]) => scores.length > 0,
      );
    });

    return () => (
      <div class='leaderboard'>
        <h3>Leaderboard</h3>
        <>
          {filteredEntries.value.length > 0 ? (
            filteredEntries.value.map(([difficulty, scores]) => (
              <div key={difficulty} class='leaderboard-section'>
                <h5>{difficulty}</h5>
                <ol>
                  {scores.map((entry, index) => (
                    <li key={`${difficulty}-${index}`}>{entry.score}</li>
                  ))}
                </ol>
              </div>
            ))
          ) : (
            <p>No scores yet. Be the first to score!</p>
          )}
        </>
      </div>
    );
  },
});

export default Leaderboard;
