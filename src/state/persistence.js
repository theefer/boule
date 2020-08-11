import { onMount } from 'svelte';
import { writable } from 'svelte/store';

export const NUMBER = {
  deserialize: (s) => Number(s),
  serialize: (n) => String(n),
};

export const STRING = {
  deserialize: (s) => s,
  serialize: (s) => s,
};

export const OBJECT = {
  deserialize: (s) => JSON.parse(s),
  serialize: (o) => JSON.stringify(o),
};

export const BOOLEAN = {
  deserialize: (s) => s === "true",
  serialize: (b) => String(b),
};

export function withLocalStorage(key, defaultValue, serialization) {
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
