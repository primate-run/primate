declare namespace WebAssembly {
  type UnknownCallback = (...args: unknown[]) => unknown;
  function promisingImpl<T extends UnknownCallback>(callback: T): T;
  class SuspendingImpl<T extends UnknownCallback> {
    constructor(callback: T)
  };

  export const promising: void | typeof promisingImpl;
  export const Suspending: void | typeof SuspendingImpl;
}