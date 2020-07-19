
export function hours(n) {
  return minutes(n * 60);
}

export function minutes(n) {
  return seconds(n * 60);
}

export function seconds(n) {
  return n * 1000;
}
