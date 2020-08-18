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
  deserialize: (s) => {
    const obj = JSON.parse(s);
    processDates(obj);
    return obj;
  },
  serialize: (o) => JSON.stringify(o),
};

export const BOOLEAN: Serializer<boolean> = {
  deserialize: (s) => s === "true",
  serialize: (b) => String(b),
};

export function withLocalStorage<T>(key: string, defaultValue: T, serialization: Serializer<T>): Writable<T> {
  const v = writable(defaultValue);

  onMount(() => {
    const localStorageValue = localStorage[key];
    const initialValue = localStorageValue != null ? serialization.deserialize(localStorageValue) : defaultValue;
    v.set(initialValue);
    v.subscribe($v => {
      localStorage[key] = $v != null ? serialization.serialize($v) : $v;
    });
  });

  return v;
}



// Hacky processor to turn string-serialized Date objects back into Dates.
function processDates(obj: unknown) {
  if (!isObject(obj)) {
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && isSerializedDate(value)) {
      obj[key] = deserializeDate(value);
    } else if (Array.isArray(value)) {
      value.forEach(processDates);
    } else if (typeof value === 'object') {
      processDates(value);
    }
  }
}

function isObject(obj: unknown): obj is { [key: string]: unknown } {
  return typeof obj === 'object' && !Array.isArray(obj) && obj != null;
}

const isSerializedDate = (s: string) => s.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
const deserializeDate = (s: string) => new Date(s);
