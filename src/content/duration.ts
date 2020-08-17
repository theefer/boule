/** Duration is a number of seconds. */
export type Duration = number;

export function hours(n: number): Duration {
  return minutes(n * 60);
}

export function minutes(n: number): Duration {
  return seconds(n * 60);
}

export function seconds(n: number): Duration {
  return n * 1000;
}
