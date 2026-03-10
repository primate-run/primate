import http from "#client/http";
import root from "#client/root";
import storage from "#client/storage";
import { MIME } from "@rcompat/http";

const headers = {
  Accept: MIME.APPLICATION_JSON,
};

export default async function submit(
  pathname: string,
  body: any,
  method: string,
): Promise<Response> {
  const { requested, response } = await http.refetch(pathname, {
    body, headers, method,
  });

  if (response.redirected) {
    const { location, document, history } = globalThis;
    const scrollTop = document.scrollingElement?.scrollTop ?? 0;

    if (http.is_json(response)) root.update(await response.json());

    storage.new({
      hash: location.hash,
      pathname: location.pathname,
      scrollTop,
    });

    const url = new URL(response.url);
    history.pushState({}, "", url.pathname + url.search);
    return response;
  }

  if (http.is_json(response)) {
    if (response.ok) {
      root.update(await response.json());
      history.replaceState({}, "", requested.pathname + requested.search);
    }
    return response;
  }

  if (response.status === 204) return response;

  const target = response.type !== "opaqueredirect"
    ? requested.toString()
    : new URL(pathname, globalThis.location.href).toString();
  globalThis.location.assign(target);
  return response;
}
