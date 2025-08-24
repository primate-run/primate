interface RequestBag {
  get(key: string): string;
  try(key: string): string | undefined;
  has(key: string): boolean;
  as<T>(schema: { parse(x: unknown): T }): T;
  toJSON(): Record<string, string>;
}
