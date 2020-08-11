
export function getDurationMin(duration) {
  return duration.type === 'range' ? duration.min : duration.value;
}

export function isReady(startTime, duration) {
  const minDuration = getDurationMin(duration);
  const now = new Date();
  return now - startTime > minDuration;
}

export function addMinDuration(startTime, duration) {
  const minDuration = getDurationMin(duration);
  const d = new Date(startTime);
  d.setMilliseconds(d.getMilliseconds() + minDuration);
  return d;
}
