/**
 * Resolve a translation key from a catalog:
 * - try exact flat-key match (including keys containing dots)
 * - otherwise traverse dot-path segments
 */
export default function resolve(root: unknown, key: string): unknown {
  if (root == null) return undefined;

  if (typeof root === "object" && Object.hasOwn(root, key)) {
    return (root as any)[key];
  }

  const parts = key.split(".");
  let current: any = root;

  for (const part of parts) {
    if (part === "") continue;
    if (current == null) return undefined;

    if (Array.isArray(current)) {
      if (!/^(0|[1-9]\d*)$/.test(part)) return undefined;
      current = current[Number(part)];
      continue;
    }

    if (typeof current === "object") {
      current = current[part];
      continue;
    }

    return undefined;
  }

  return current;
}
