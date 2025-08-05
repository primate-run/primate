import type ValidationError from "@primate/core/frontend/ValidationError";
import type Dict from "@rcompat/type/Dict";
import type { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs";

type ValidateUpdater<T> = (previous: T) => T;

class Validate<T> {
  #valueSubject: BehaviorSubject<T>;
  #loadingSubject = new BehaviorSubject<boolean>(false);
  #errorSubject = new BehaviorSubject<null | ValidationError<T>>(null);
  #updateFn: (value: T) => Promise<void>;
  #value: Observable<T>;
  #loading: Observable<boolean>;
  #error: Observable<null | ValidationError<T>>;

  constructor(initial: T, updateFn: (value: T) => Promise<void>) {
    this.#valueSubject = new BehaviorSubject(initial);
    this.#updateFn = updateFn;

    this.#value = this.#valueSubject.asObservable();
    this.#loading = this.#loadingSubject.asObservable();
    this.#error = this.#errorSubject.asObservable();
  }

  get value2() {
    return this.#valueSubject.value;
  }

  get value() {
    return this.#value;
  }

  get loading() {
    return this.#loading;
  }

  get error() {
    return this.#error;
  }

  async update(updater: ValidateUpdater<T>) {
    const previous = this.#valueSubject.value;
    const newValue = updater(previous);

    this.#valueSubject.next(newValue);
    this.#loadingSubject.next(true);
    this.#errorSubject.next(null);

    try {
      await this.#updateFn(newValue);
    } catch (e) {
      // rollback
      this.#valueSubject.next(previous);
      this.#errorSubject.next(e as ValidationError<T>);
    } finally {
      this.#loadingSubject.next(false);
    }
  }
}

export default function validate<T>(initial: T) {
  return {
    post: (
      url: string,
      mapper: (newValue: T) => unknown,
      headers: Dict<string> = { "Content-Type": "application/json" },
    ) => new Validate<T>(initial, async (newValue) => {
      const res = await fetch(url, {
        body: JSON.stringify(mapper(newValue)),
        headers,
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw data.error as ValidationError<T>;
      }
    }),
  };
}
