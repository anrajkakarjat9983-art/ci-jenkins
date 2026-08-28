function countdown(seconds, onTick = () => {}, onDone = () => {}) {
  let remaining = seconds;

  const intervalId = setInterval(() => {
    if (remaining <= 0) {
      clearInterval(intervalId);
      onDone();
      return;
    }

    onTick(remaining);
    remaining -= 1;
  }, 1000);
}

countdown(
  10,
  (remaining) => console.log(`Time left: ${remaining}s`),
  () => console.log('Time is up!')
);
