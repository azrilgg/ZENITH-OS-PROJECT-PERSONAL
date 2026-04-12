// ZENITH OS — Pomodoro Web Worker
// Runs in background thread for persistent timing

let timer = null;
let remaining = 0;
let isRunning = false;

self.onmessage = function(e) {
  const { type, duration } = e.data;

  switch (type) {
    case 'START':
      remaining = duration;
      isRunning = true;
      clearInterval(timer);
      timer = setInterval(() => {
        if (remaining > 0) {
          remaining--;
          self.postMessage({ type: 'TICK', remaining });
        } else {
          isRunning = false;
          clearInterval(timer);
          timer = null;
          self.postMessage({ type: 'COMPLETE' });
        }
      }, 1000);
      break;

    case 'PAUSE':
      isRunning = false;
      clearInterval(timer);
      timer = null;
      self.postMessage({ type: 'PAUSED', remaining });
      break;

    case 'RESUME':
      if (remaining > 0 && !isRunning) {
        isRunning = true;
        timer = setInterval(() => {
          if (remaining > 0) {
            remaining--;
            self.postMessage({ type: 'TICK', remaining });
          } else {
            isRunning = false;
            clearInterval(timer);
            timer = null;
            self.postMessage({ type: 'COMPLETE' });
          }
        }, 1000);
      }
      break;

    case 'RESET':
      isRunning = false;
      clearInterval(timer);
      timer = null;
      remaining = duration || 0;
      self.postMessage({ type: 'RESET', remaining });
      break;

    case 'STATUS':
      self.postMessage({ type: 'STATUS', remaining, isRunning });
      break;
  }
};
