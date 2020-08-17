import { onMount } from 'svelte';
import { writable, Writable } from 'svelte/store';

interface Serializer<T> {
  deserialize(s: string): T;
  serialize(v: T): string;
}

export const NUMBER: Serializer<number> = {
  deserialize: (s) => Number(s),
  serialize: (n) => String(n),
};

export const STRING: Serializer<string> = {
  deserialize: (s) => s,
  serialize: (s) => s,
};

export const OBJECT: Serializer<{}> = {
  deserialize: (s) => JSON.parse(s),
  serialize: (o) => JSON.stringify(o),
};

export const BOOLEAN: Serializer<boolean> = {
  deserialize: (s) => s === "true",
  serialize: (b) => String(b),
};

export function withLocalStorage<T>(key: string, defaultValue: T, serialization: Serializer<T>): Writable<T> {
  const v = writable(defaultValue);

  onMount(() => {
    // TODO: parse JSON?
    const localStorageValue = localStorage[key];
    const initialValue = localStorageValue != null ? serialization.deserialize(localStorageValue) : defaultValue;
    v.set(initialValue);
    v.subscribe($v => {
      localStorage[key] = $v != null ? serialization.serialize($v) : $v;
    });
  });

  return v;
}
