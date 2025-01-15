import { reactive } from 'vue';

interface Timer {
  time: number;
  isRunning: boolean;
  intervalId: ReturnType<typeof setInterval> | null;
  hasStarted: boolean;
}

export const timer = reactive<Timer>({
  time: 0,
  isRunning: false,
  intervalId: null,
  hasStarted: false,
});

export const startTimer = () => {
  if (timer.isRunning) return;

  timer.isRunning = true;
  timer.intervalId = setInterval(() => {
    timer.time += 1;
  }, 1000);
};

export const clearTimer = () => {
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
};

export const stopTimer = () => {
  if (!timer.isRunning) return;

  clearTimer();
  timer.isRunning = false;
};

export const resetTimer = () => {
  clearTimer();
  timer.isRunning = false;
  startTimer();
  timer.time = 0;
};

export const setHasTimerStarted = (timerStarted: boolean) => {
  timer.hasStarted = timerStarted;
};

let visibilityChangeListener: (() => void) | null = null;
let blurListener: (() => void) | null = null;
let focusListener: (() => void) | null = null;

export const setupVisibilityAndFocusListeners = () => {
  cleanupVisibilityAndFocusListeners();

  visibilityChangeListener = () => {
    if (document.hidden) {
      stopTimer();
    } else if (timer.hasStarted) {
      startTimer();
    }
  };
  document.addEventListener('visibilitychange', visibilityChangeListener);

  blurListener = () => stopTimer();
  window.addEventListener('blur', blurListener);

  focusListener = () => {
    if (timer.hasStarted) {
      startTimer();
    }
  };
  window.addEventListener('focus', focusListener);
};

export const cleanupVisibilityAndFocusListeners = () => {
  if (visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener);
    visibilityChangeListener = null;
  }
  if (blurListener) {
    window.removeEventListener('blur', blurListener);
    blurListener = null;
  }
  if (focusListener) {
    window.removeEventListener('focus', focusListener);
    focusListener = null;
  }
};
