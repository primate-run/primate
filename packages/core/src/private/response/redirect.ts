import type ResponseFunction from "#response/ResponseFunction";
import Status from "@rcompat/http/Status";

type Redirection =
  | 300 // MULTIPLE_CHOICES
  | 301 // MOVED_PERMANENTLY
  | 302 // FOUND
  | 303 // SEE_OTHER
  | 304 // NOT_MODIFIED
  // 305 USE_PROXY (deprecated)
  // 306 SWITCH_PROXY (reserved)
  | 307 // TEMPORARY_REDIRECT
  | 308 // PERMANENT_REDIRECT
  ;

type RedirectObject = {
  // must starts with "/"
  pathname: string;
  query?: Record<string, boolean | null | number | string | undefined>;
};

type RedirectTarget = RedirectObject | string;

type RedirectOptions = {
  // Allow absolute external redirects. Default: false (same-origin only)
  allowExternal?: boolean;
  // Base URL used to normalize relative paths & compare origins, default `request.url`
  base?: string | URL;
  // Max allowed Location header size (bytes), default 2048
  maxLocationBytes?: number;
};

type RedirectInit = {
  headers?: HeadersInit;
  status?: 301 | 302 | 303 | 307 | 308;
} & Omit<ResponseInit, "headers" | "status"> & RedirectOptions;

function hasCRLF(s: string): boolean {
  return /[\r\n]/.test(s);
}

function isAbsoluteUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function encodePathname(s: string): string {
  // Expect strict origin-form path ("/..."), disallow protocol-relative and
  // backslashes
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\")) {
    throw new Error("invalid pathname");
  }
  // Encode per segment to avoid double-encoding present percent-escapes
  return s.split("/")
    .map((each, i) => i === 0 ? "" : encodeURIComponent(each)).join("/");
}

function toSearch(query?: RedirectObject["query"]) {
  if (!query) {
    return "";
  }

  const search = Object.entries(query)
    .filter(([, v]) => v !== null && v !== undefined)
    .reduce((params, [k, v]) => {
      params.append(k, String(v));
      return params;
    }, new URLSearchParams())
    .toString()
    ;

  return search ? "?" + search : "";
}

function toNormalized(relative: string, base?: string | URL): string {
  // base -> URL resolution
  if (base) {
    const url = new URL(relative, new URL(String(base)));
    return url.pathname + url.search;
  }
  // no base -> enforce strict single-slash path and strip fragment
  if (!relative.startsWith("/") || relative.startsWith("//")) {
    throw new Error("bad relative");
  }

  const i = relative.indexOf("#");
  return i === -1 ? relative : relative.slice(0, i);
}

/**
 * Redirect request
 * @param location location to redirect to
 * @param status redirection 3xx code
 * @return Response rendering function
 */
export default (location: string, status?: Redirection): ResponseFunction =>
  // no body
  app => app.respond(null, {
    headers: { Location: location },
    status: status ?? Status.FOUND,
  });
