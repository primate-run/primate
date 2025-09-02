/**
 * Public session API available inside routes with
 * import session from "#session";
 *
 * `T` is inferred automatically from the app's `config/session.ts` schema.
 */
export default interface SessionFacade<T> {
  /**
   * The unique session identifier for the current user, or `undefined` if no
   * session has been created yet or if it has been destroyed.
   *
   * This value is typically sent back to the client in a cookie.
   */
  readonly id: string | undefined;

  /**
   * Whether a session currently exists.
   *
   * Equivalent to checking `id !== undefined`.
   */
  readonly exists: boolean;

  /**
   * Create a new session. Optionally accepts initial data.
   *
   * - If a session already exists, this is a no-op.
   * - Data is validated through the schema if one was provided.
   */
  create(initial?: T): void;

  /**
   * Get the current session data.
   *
   * @throws if the session does not exist.
   */
  get(): Readonly<T>;

  /**
   * Get the current session data if it exists, otherwise return `undefined`.
   */
  try(): Readonly<T> | undefined;

  /**
   * Replace the current session data.
   *
   * - Accepts either a new object or a callback that maps the previous data to
   *   the next.
   * - Data is validated through the schema if one was provided.
   *
   * @throws if the session does not exist.
   */
  set(next: ((previous: Readonly<T>) => T) | T): void;

  /**
   * Destroy the current session.
   *
   * - If no session exists, this is a no-op.
   * - After destruction, `id` becomes `undefined` and `exists` returns `false`.
   */
  destroy(): void;
}
