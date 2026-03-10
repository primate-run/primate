import type { RequestView } from "@primate/core";

let current: RequestView;
const subscribers = new Set<() => void>();

export const set = (value: RequestView) => {
  current = value;
  subscribers.forEach(fn => fn());
};

export const get = () => current;

export const subscribe = (fn: () => void) => {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
};
