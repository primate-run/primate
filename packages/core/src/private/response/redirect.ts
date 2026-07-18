import type ResponseFunction from "#response/ResponseFunction";
import {
  isRedirectStatus,
  type RedirectStatus,
} from "#response/redirect-status";

const DEFAULT_MAX_LOCATION_BYTES = 2048;
const LOCAL_BASE = new URL("https://primate.invalid/");
const METHOD_PRESERVING_STATUSES = new Set<RedirectStatus>([307, 308]);
const INVALID_PERCENT_ESCAPE = /%(?![\da-f]{2})/iu;
const ENCODED_PATH_CONTROL = /%(?:0[\da-f]|1[\da-f]|7f)/iu;
const ENCODED_BACKSLASH = /%5c/iu;
const ORIGIN_FORM = /^[a-z][a-z\d+.-]*:\/\/[^/?#]+\/?$/iu;

type RedirectQueryValue = boolean | null | number | string | undefined;

type LocalRedirectTarget = {
  pathname: string;
  query?: Readonly<Record<
    string,
    RedirectQueryValue | readonly RedirectQueryValue[]
  >>;
  hash?: string;
};

type RedirectInit = {
  headers?: HeadersInit;
  status?: RedirectStatus;
  maxLocationBytes?: number;
};

type ExternalRedirectInit = RedirectInit & {
  allowedOrigins: readonly string[];
  allowHttp?: boolean;
  preserveMethod?: boolean;
};

type RedirectErrorCode =
  | "credentials_not_allowed"
  | "external_method_preservation_not_allowed"
  | "external_origin_not_allowed"
  | "external_scheme_not_allowed"
  | "invalid_external_target"
  | "invalid_local_target"
  | "invalid_redirect_status"
  | "location_too_long";

class RedirectError extends TypeError {
  readonly code: RedirectErrorCode;

  constructor(code: RedirectErrorCode) {
    const messages: Record<RedirectErrorCode, string> = {
      credentials_not_allowed: "redirect URL credentials are not allowed",
      external_method_preservation_not_allowed:
        "external 307 and 308 redirects require preserveMethod",
      external_origin_not_allowed: "redirect origin is not allowlisted",
      external_scheme_not_allowed: "redirect URL must use HTTPS",
      invalid_external_target: "invalid external redirect target",
      invalid_local_target: "invalid local redirect target",
      invalid_redirect_status: "invalid redirect status",
      location_too_long: "redirect Location exceeds the configured byte limit",
    };
    super(messages[code]);
    this.name = "RedirectError";
    this.code = code;
  }
}

type LocalRedirect = {
  (target: LocalRedirectTarget | string, init?: RedirectInit | RedirectStatus):
    ResponseFunction<never>;
};

type ExternalRedirect = {
  (target: string | URL, init: ExternalRedirectInit): ResponseFunction<never>;
};

type Redirect = LocalRedirect & {
  local: LocalRedirect;
  external: ExternalRedirect;
};

function fail(code: RedirectErrorCode): never {
  throw new RedirectError(code);
}

function hasForbiddenControl(value: string) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function locationBytes(location: string) {
  return new TextEncoder().encode(location).byteLength;
}

function maxLocationBytes(value: unknown): number {
  const maximum = value === undefined ? DEFAULT_MAX_LOCATION_BYTES : value;
  if (
    typeof maximum !== "number"
    || !Number.isSafeInteger(maximum)
    || maximum <= 0
  ) {
    fail("location_too_long");
  }
  return maximum;
}

function status(value: unknown): RedirectStatus {
  const redirectStatus = value ?? 302;
  if (!isRedirectStatus(redirectStatus as number)) {
    fail("invalid_redirect_status");
  }
  return redirectStatus as RedirectStatus;
}

function normalizeInit(value: unknown): RedirectInit {
  if (typeof value === "number") return { status: status(value) };
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("invalid_redirect_status");
  }
  return value as RedirectInit;
}

function checkRawLocalTarget(target: string) {
  if (
    target.trim() !== target
    || !target.startsWith("/")
    || target.startsWith("//")
    || target.includes("\\")
    || hasForbiddenControl(target)
    || INVALID_PERCENT_ESCAPE.test(target)
  ) {
    fail("invalid_local_target");
  }
}

function checkSerializedLocal(
  location: string,
  base: URL,
  maximum: number,
) {
  if (
    !location.startsWith("/")
    || location.startsWith("//")
    || location.includes("\\")
    || hasForbiddenControl(location)
    || INVALID_PERCENT_ESCAPE.test(location)
  ) {
    fail("invalid_local_target");
  }

  let resolved: URL;
  try {
    resolved = new URL(location, base);
  } catch {
    fail("invalid_local_target");
  }

  if (
    resolved.origin !== base.origin
    || !resolved.pathname.startsWith("/")
    || resolved.pathname.startsWith("//")
    || resolved.pathname.includes("\\")
    || ENCODED_BACKSLASH.test(resolved.pathname)
    || ENCODED_PATH_CONTROL.test(resolved.pathname)
  ) {
    fail("invalid_local_target");
  }

  if (locationBytes(location) > maximum) fail("location_too_long");
}

function appendQuery(url: URL, query: unknown) {
  if (query === undefined) return;
  if (query === null || typeof query !== "object" || Array.isArray(query)) {
    fail("invalid_local_target");
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (item === null || item === undefined) continue;
      if (!["boolean", "number", "string"].includes(typeof item)) {
        fail("invalid_local_target");
      }
      if (typeof item === "number" && !Number.isFinite(item)) {
        fail("invalid_local_target");
      }
      params.append(key, String(item));
    }
  }
  url.search = params.toString();
}

function serializeLocal(target: unknown, maximum: number) {
  let url: URL;
  if (typeof target === "string") {
    checkRawLocalTarget(target);
    try {
      url = new URL(target, LOCAL_BASE);
    } catch {
      fail("invalid_local_target");
    }
  } else {
    if (
      target === null
      || target instanceof URL
      || typeof target !== "object"
      || !("pathname" in target)
      || typeof target.pathname !== "string"
      || target.pathname.includes("?")
      || target.pathname.includes("#")
    ) {
      fail("invalid_local_target");
    }
    const object = target as {
      pathname: string;
      query?: unknown;
      hash?: unknown;
    };
    checkRawLocalTarget(object.pathname);
    try {
      url = new URL(object.pathname, LOCAL_BASE);
    } catch {
      fail("invalid_local_target");
    }
    appendQuery(url, object.query);
    if (object.hash !== undefined) {
      if (
        typeof object.hash !== "string"
        || hasForbiddenControl(object.hash)
      ) {
        fail("invalid_local_target");
      }
      url.hash = object.hash.startsWith("#")
        ? object.hash
        : `#${object.hash}`;
    }
  }

  const location = url.pathname + url.search + url.hash;
  checkSerializedLocal(location, LOCAL_BASE, maximum);
  return location;
}

function response(
  location: string,
  redirectStatus: RedirectStatus,
  headersInit: HeadersInit | undefined,
): ResponseFunction<never> {
  return app => {
    const headers = new Headers(headersInit);
    headers.set("Location", location);
    headers.set("Content-Length", "0");
    if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-cache");

    return app.respond(null, {
      headers: Object.fromEntries(headers),
      status: redirectStatus,
    });
  };
}

const local = ((target: unknown, options: unknown) => {
  const normalized = normalizeInit(options);
  const redirectStatus = status(normalized.status);
  const maximum = maxLocationBytes(normalized.maxLocationBytes);
  const location = serializeLocal(target, maximum);

  return (app, transfer, request) => {
    checkSerializedLocal(location, request.url, maximum);
    return response(location, redirectStatus, normalized.headers)(
      app,
      transfer,
      request,
    );
  };
}) as LocalRedirect;

function parseExternalOrigin(origin: unknown, allowHttp: boolean) {
  if (
    typeof origin !== "string"
    || origin.trim() !== origin
    || hasForbiddenControl(origin)
    || origin.includes("\\")
    || !ORIGIN_FORM.test(origin)
  ) {
    fail("invalid_external_target");
  }

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    fail("invalid_external_target");
  }

  const allowedProtocol = url.protocol === "https:"
    || allowHttp && url.protocol === "http:";
  if (!allowedProtocol) fail("external_scheme_not_allowed");
  if (url.username !== "" || url.password !== "") fail("credentials_not_allowed");
  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    fail("invalid_external_target");
  }
  return url.origin;
}

function serializeExternal(target: unknown, options: ExternalRedirectInit) {
  const raw = target instanceof URL ? target.href : target;
  if (
    typeof raw !== "string"
    || raw.trim() !== raw
    || hasForbiddenControl(raw)
    || raw.includes("\\")
  ) {
    fail("invalid_external_target");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    fail("invalid_external_target");
  }

  const allowHttp = options.allowHttp === true;
  const allowedProtocol = url.protocol === "https:"
    || allowHttp && url.protocol === "http:";
  if (!allowedProtocol) fail("external_scheme_not_allowed");
  if (url.username !== "" || url.password !== "") fail("credentials_not_allowed");
  if (!Array.isArray(options.allowedOrigins) || options.allowedOrigins.length === 0) {
    fail("external_origin_not_allowed");
  }

  const origins = new Set(options.allowedOrigins
    .map(origin => parseExternalOrigin(origin, allowHttp)));
  if (!origins.has(url.origin)) fail("external_origin_not_allowed");

  // An explicit empty fragment prevents user agents from inheriting a source
  // fragment when the destination itself has no fragment.
  const location = url.hash === "" && !url.href.endsWith("#")
    ? `${url.href}#`
    : url.href;
  if (locationBytes(location) > maxLocationBytes(options.maxLocationBytes)) {
    fail("location_too_long");
  }
  return location;
}

const external = ((target: unknown, options: unknown) => {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    fail("external_origin_not_allowed");
  }
  const normalized = options as ExternalRedirectInit;
  const redirectStatus = status(normalized.status);
  const location = serializeExternal(target, normalized);
  if (
    METHOD_PRESERVING_STATUSES.has(redirectStatus)
    && normalized.preserveMethod !== true
  ) {
    fail("external_method_preservation_not_allowed");
  }

  return response(location, redirectStatus, normalized.headers);
}) as ExternalRedirect;

const redirect = Object.assign(local, { local, external }) as Redirect;

export {
  RedirectError,
  type ExternalRedirectInit,
  type LocalRedirectTarget,
  type RedirectInit,
  type RedirectQueryValue,
  type RedirectStatus,
};
export default redirect;
