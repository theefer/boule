export function range(min, max) {
  return {
    type: 'range',
    min,
    max,
  };
}

export function exact(value) {
  return {
    type: 'exact',
    value,
  };
}
