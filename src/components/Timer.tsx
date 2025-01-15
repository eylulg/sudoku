import { defineComponent, computed, onMounted, onUnmounted } from 'vue';

import {
  stopTimer,
  startTimer,
  timer,
  setupVisibilityAndFocusListeners,
  cleanupVisibilityAndFocusListeners,
} from '@/stores/timer';

import '@/styles/timer.css';

export default defineComponent({
  name: 'Timer',
  setup() {
    onMounted(() => {
      setupVisibilityAndFocusListeners();
    });

    onUnmounted(() => {
      cleanupVisibilityAndFocusListeners();
    });

    const formattedTime = computed(() => {
      const minutes = Math.floor(timer.time / 60);
      const seconds = timer.time % 60;
      return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    });

    const toggleTimer = () => {
      if (timer.isRunning) {
        stopTimer();
      } else {
        startTimer();
      }
    };

    return () => (
      <div class='timer-container'>
        <p class='timer-text'>
          <b>Time Spent:</b> {formattedTime.value}
        </p>
        <button
          class='timer-button'
          onClick={toggleTimer}
          disabled={!timer.hasStarted}
        >
          {timer.isRunning ? '⏸' : '▶'}
        </button>
      </div>
    );
  },
});
