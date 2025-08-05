import type ValidateInit from "#frontend/ValidateInit";

export default async function validate<T>(
  init: Omit<ValidateInit<T>, "initial">,
  next: T,
): Promise<void> {
  const res = await fetch(init.url, {
    body: JSON.stringify(init.mapper(next)),
    headers: init.headers ?? { "Content-Type": "application/json" },
    method: init.method,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw data.error;
  }
}
