type Listener<Event> = (event: Event) => void;

type Channel<Key, Event> = Readonly<{
  emit(key: Key, event: Event): void;
  subscribe(key: Key, listener: Listener<Event>): () => void;
}>;

function channel<Key, Event>(): Channel<Key, Event> {
  const listeners = new Map<Key, Set<Listener<Event>>>();

  return {
    emit(key, event) {
      for (const listener of [...listeners.get(key) ?? []]) listener(event);
    },

    subscribe(key, listener) {
      const set = listeners.get(key) ?? new Set<Listener<Event>>();
      set.add(listener);
      listeners.set(key, set);

      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(key);
      };
    },
  };
}

const events = {
  channel,
};

export default events;
