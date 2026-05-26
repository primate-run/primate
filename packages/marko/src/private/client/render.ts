type Invalidate = () => void;

type Frame = {
  index: number;
  slots: Map<number, unknown>;
  invalidate: Invalidate;
};

let current: Frame | undefined;

function create(on_invalidate: Invalidate) {
  let key: string | undefined;
  let slots = new Map<number, unknown>();
  let queued = false;

  const invalidate = () => {
    if (queued) return;

    queued = true;
    queueMicrotask(() => {
      queued = false;
      on_invalidate();
    });
  };

  return {
    run<T>(next_key: string, callback: () => T): T {
      if (next_key !== key) {
        key = next_key;
        slots = new Map();
      }

      const previous = current;

      current = {
        index: 0,
        slots,
        invalidate,
      };

      try {
        return callback();
      } finally {
        current = previous;
      }
    },

    reset() {
      key = undefined;
      slots = new Map();
      queued = false;
    },
  };
}

function slot<T>(create_value: (invalidate: Invalidate) => T): T {
  if (current === undefined) {
    return create_value(() => undefined);
  }

  const index = current.index++;
  let value = current.slots.get(index) as T | undefined;

  if (value === undefined) {
    value = create_value(current.invalidate);
    current.slots.set(index, value);
  }

  return value;
}

function once(state: { initialized: boolean }) {
  const first = !state.initialized;

  state.initialized = true;
  return first;
}

export default {
  create,
  once,
  slot,
};
