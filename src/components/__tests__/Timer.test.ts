import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import {
  timer,
  startTimer,
  stopTimer,
  resetTimer,
  setupVisibilityAndFocusListeners,
  clearTimer,
  setHasTimerStarted,
} from '@/stores/timer';

describe('Timer', () => {
  beforeEach(() => {
    clearTimer();
    timer.isRunning = false;
    timer.time = 0;
  });

  afterEach(() => {
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }

    document.removeEventListener('visibilitychange', vi.fn());
    window.removeEventListener('blur', vi.fn());
    window.removeEventListener('focus', vi.fn());
  });

  it('should initialize with default values', () => {
    expect(timer.time).toBe(0);
    expect(timer.isRunning).toBe(false);
    expect(timer.intervalId).toBe(null);
  });

  it('should start the timer', () => {
    startTimer();
    expect(timer.isRunning).toBe(true);
    expect(timer.intervalId).not.toBe(null);
  });

  it('should increment time when running', async () => {
    vi.useFakeTimers();
    startTimer();

    vi.advanceTimersByTime(3000);
    expect(timer.time).toBe(3);

    vi.useRealTimers();
  });

  it('should pause the timer', () => {
    startTimer();
    stopTimer();

    expect(timer.isRunning).toBe(false);
    expect(timer.intervalId).toBe(null);
  });

  it('should reset the timer', () => {
    startTimer();
    timer.time = 10;

    resetTimer();
    expect(timer.time).toBe(0);
    expect(timer.isRunning).toBe(true);
    expect(timer.intervalId).not.toBe(null);
  });

  it('should pause on tab change and resume on focus', () => {
    setupVisibilityAndFocusListeners();

    startTimer();
    setHasTimerStarted(true);
    expect(timer.isRunning).toBe(true);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
      writable: true,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(timer.isRunning).toBe(false);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });

    document.dispatchEvent(new Event('visibilitychange'));
    expect(timer.isRunning).toBe(true);
  });

  it('should pause and resume on window focus/blur events', () => {
    setupVisibilityAndFocusListeners();

    startTimer();
    expect(timer.isRunning).toBe(true);

    window.dispatchEvent(new Event('blur'));
    expect(timer.isRunning).toBe(false);

    window.dispatchEvent(new Event('focus'));
    expect(timer.isRunning).toBe(true);
  });
});
