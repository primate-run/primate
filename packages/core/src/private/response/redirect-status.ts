export type RedirectStatus = 301 | 302 | 303 | 307 | 308;

const statuses = new Set<number>([301, 302, 303, 307, 308]);

export function isRedirectStatus(status: number): status is RedirectStatus {
  return statuses.has(status);
}
