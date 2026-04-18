import http from "@rcompat/http";

const sameorigin = (url: URL) => url.origin === globalThis.location.origin;

const get_location = (response: Response, base: string) => {
  if (response.type === "opaqueredirect") return null;
  const location = response.headers.get("Location");
  return location !== null ? new URL(location, base) : null;
};

async function refetch(
  input: string | URL,
  init: RequestInit = {},
  max_hops = 5,
): Promise<{ requested: URL; response: Response }> {
  console.log("location.href", globalThis.location.href);
  console.log("input", input.toString());
  let url = new URL(input.toString(), globalThis.location.href);

  const method = (init.method ?? "GET").toUpperCase();
  let hops = 0;

  if (method !== "GET") {
    const response = await fetch(url.pathname + url.search, {
      ...init, redirect: "follow",
    });
    return { requested: new URL(response.url), response };
  }

  while (hops < max_hops) {
    const response = await fetch(url.pathname + url.search, {
      ...init, redirect: "manual",
    });

    if (response.type === "opaqueredirect") return { requested: url, response };

    const location = get_location(response, url.toString());
    if (location !== null && response.status >= 300 && response.status < 400) {
      if (!sameorigin(location)) return { requested: url, response };
      url = location;
      hops++;
      continue;
    }

    return { requested: url, response };
  }
  throw new Error("Too many redirects");
}

function is_json(response: Response) {
  const raw = response.headers.get("content-type") ?? "";
  return raw.split(";")[0].trim() === http.MIME.APPLICATION_JSON;
}

async function submit(pathname: string, body: any, method: string) {
  const { requested, response } = await refetch(pathname, { body, method });

  if (is_json(response)) {
    history.replaceState({}, "", requested.pathname + requested.search);
  } else {
    globalThis.location.assign(requested.toString());
  }

  return response;
}

const transport = { refetch, is_json, submit };

export default transport;
