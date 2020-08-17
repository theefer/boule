import type { Duration } from "../content/duration";
import type { Quantity } from "../content/quantity";

export function getDurationMin(duration: Quantity<Duration>): Duration {
  return duration.type === 'range' ? duration.min : duration.value;
}

export function isReady(startTime: Date, duration: Quantity<Duration>): boolean {
  const minDuration = getDurationMin(duration);
  const now = new Date();
  return now.getTime() - startTime.getTime() > minDuration;
}

export function addMinDuration(startTime: Date, duration: Quantity<Duration>): Date {
  const minDuration = getDurationMin(duration);
  const d = new Date(startTime);
  d.setMilliseconds(d.getMilliseconds() + minDuration);
  return d;
}
