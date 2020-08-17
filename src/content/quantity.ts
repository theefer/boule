export type Quantity<T> = QuantityRange<T> | QuantityExact<T>;

interface QuantityRange<T> {
  readonly type: 'range';
  readonly min: T;
  readonly max: T;
}

interface QuantityExact<T> {
  readonly type: 'exact';
  readonly value: T;
}

export function range<T>(min: T, max: T): QuantityRange<T> {
  return {
    type: 'range',
    min,
    max,
  };
}

export function exact<T>(value: T): QuantityExact<T> {
  return {
    type: 'exact',
    value,
  };
}
