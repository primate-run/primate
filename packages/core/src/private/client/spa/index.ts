import type ClientData from "#client/Data";
import storage from "#client/spa/storage";
import type Dict from "@rcompat/type/Dict";

const APPLICATION_JSON = "application/json";
const MULTIPART_FORM_DATA = "multipart/form-data";
const { document } = globalThis;
const headers = {
  Accept: APPLICATION_JSON,
};

const get_by_id_or_name = (name: string) =>
  document.getElementById(name) ?? document.getElementsByName(name)[0];

const scroll = globalThis.scrollTo;
const scroll_hash = (hash: string) => {
  if (hash === "") {
    scroll(0, 0);
  } else {
    // https://html.spec.whatwg.org/browsing-the-web.html#scroll-to-fragid
    // first try id, then name
    get_by_id_or_name(hash.slice(1)).scrollIntoView();
  }
};

type Updater<T extends Dict> = (json: ClientData<T>, after?: () => void) => void;

const sameorigin = (url: URL) => url.origin === globalThis.location.origin;

const getLocation = (response: Response, base: string) => {
  // only readable when not opaqueredirect
  if (response.type === "opaqueredirect") return null;
  const location = response.headers.get("Location");
  return location ? new URL(location, base) : null;
};

// Follows same-origin redirects in "manual" mode up to a small limit
async function refetch(
  input: string | URL,
  init: RequestInit = {},
  maxHops = 5,
): Promise<{ requested: URL; response: Response }> {
  let url = new URL(input.toString(), globalThis.location.href);
  let hops = 0;

  while (hops < maxHops) {
    const response = await fetch(url.pathname + url.search, {
      ...init, redirect: "manual",
    });

    // cross-origin redirect -> bail
    if (response.type === "opaqueredirect") {
      return { requested: url, response: response };
    }

    // same-origin redirect we can see?
    const location = getLocation(response, url.toString());
    if (location && (response.status >= 300 && response.status < 400)) {
      // would go cross-origin -> bail
      if (!sameorigin(location)) return { requested: url, response: response };
      // follow internally without touching history
      url = location;
      hops++;
      continue;
    }

    // not a redirect -> return it
    return { requested: url, response };
  }
  throw new Error("Too many redirects");
}

function is_json(response: Response) {
  const raw = response.headers.get("content-type") || "";
  const mime = raw.split(";")[0].trim();
  return mime === APPLICATION_JSON;
};

const handle = async (response: Response, updater: Updater<any>) => {
  // if it's JSON, process SPA update and keep history under our control
  if (is_json(response)) {
    updater(await response.json());
    return true; // handled in SPA
  }
  // not JSON ⇒ we will hard-navigate outside the SPA
  return false;
};

type Goto = {
  hash: string;
  pathname: string;
};

const goto = async ({ hash, pathname }: Goto, updater: Updater<any>, state = false) => {
  try {
    // save before loading next
    const { scrollTop } = globalThis.document.scrollingElement!;
    const { hash: currentHash, pathname: currentPathname } = globalThis.location;
    const { requested, response } = await refetch(pathname, { headers });

    if (await handle(response, updater)) {
      if (state) {
        storage.new({ hash: currentHash, pathname: currentPathname, scrollTop });
        const url = response.redirected ? response.url : `${pathname}${hash}`;
        history.pushState({}, "", url);
      }
      return;
    }
    const target = (response.type !== "opaqueredirect")
      ? requested.toString() + hash
      : new URL(pathname + hash, globalThis.location.href).toString();
    globalThis.location.assign(target);
  } catch (error) {
    console.warn(error);
  }
};

const submit = async (pathname: string, body: any, method: string, updater: Updater<any>) => {
  try {
    const { requested, response } = await refetch(pathname, { body, headers, method });

    if (await handle(response, updater)) {
      history.replaceState({}, "", requested.pathname + requested.search);
      return;
    }
    const target = (response.type !== "opaqueredirect")
      ? requested.toString()
      : new URL(pathname, globalThis.location.href).toString();
    globalThis.location.assign(target);
  } catch (error) {
    console.warn(error);
  }
};

const go = async (href: string, updater: Updater<any>, event?: Event) => {
  const url = new URL(href);
  const { hash, pathname } = url;
  const current = globalThis.location.pathname;
  // hosts must match
  if (url.host === globalThis.location.host) {
    // prevent event
    event?.preventDefault();

    // pathname differs
    if (current !== pathname) {
      await goto(url, props => updater(props, () => {
        scroll_hash(hash);
        globalThis.dispatchEvent(new Event("updated"));
      }), true);
    }
    // different hash on same page, jump to hash
    if (hash !== globalThis.location.hash) {
      const { scrollTop } = globalThis.document.scrollingElement!;
      storage.new({
        hash: globalThis.location.hash,
        pathname: current,
        scrollTop,
        stop: true,
      });
      history.pushState(null, "", `${current}${hash}`);
      scroll_hash(hash);
    }
  }
  // external redirect
};

export default <T extends Dict>(updater: Updater<T>) => {
  globalThis.addEventListener("pageshow", event => {
    if (event.persisted) {
      globalThis.location.reload();
    }
  });

  globalThis.addEventListener("load", _ => {
    history.scrollRestoration = "manual";
    if (globalThis.location.hash !== "") {
      scroll_hash(globalThis.location.hash);
    }
  });

  globalThis.addEventListener("beforeunload", _ => {
    history.scrollRestoration = "auto";
  });

  globalThis.addEventListener("popstate", _ => {
    const state = storage.peek() ?? { scrollTop: 0 };
    const { pathname } = globalThis.location;

    let { scrollTop } = state;
    if (state.stop) {
      storage.back();
      if (state.hash) {
        scroll_hash(state.hash);
      } else {
        scroll(0, state.scrollTop);
      }
      return;
    }
    const back = state.pathname === pathname;
    if (back) {
      storage.back();
    } else {
      scrollTop = storage.forward().scrollTop;
    }

    goto(globalThis.location, props =>
      updater(props, () => scroll(0, scrollTop ?? 0)));
  });

  globalThis.addEventListener("click", event => {
    const target = (event.target as HTMLElement).closest("a");
    if (target?.tagName === "A" && target.href !== "") {
      go(target.href, updater, event);
    }
  });

  globalThis.addEventListener("submit", (event) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;

    const { enctype } = target;
    const action = target.action ?? globalThis.location.pathname;
    const url = new URL(action);
    const data = new FormData(target);
    const form = enctype === MULTIPART_FORM_DATA
      ? data
      : new URLSearchParams(data as any);
    submit(url.pathname, form, target.method, updater);
  });
};
