import type ClientData from "@primate/core/frontend/ClientData";
import type Dict from "@rcompat/type/Dict";
import storage from "./storage.js";

const TEXT_PLAIN = "text/plain";
const APPLICATION_JSON = "application/json";
const MULTIPART_FORM_DATA = "multipart/form-data";
const global = globalThis;
const { document } = global;
const headers = {
  Accept: APPLICATION_JSON,
};

const get_by_id_or_name = (name: string) =>
  document.getElementById(name) ?? document.getElementsByName(name)[0];

const scroll = global.scrollTo;
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

const handlers = {
  [APPLICATION_JSON]: async (response: Response, updater: Updater<any>) => {
    updater(await response.json());
  },
  [TEXT_PLAIN]: async (response: Response) => {
    globalThis.location.href = response.url;
  },
};

const handle = async (response: Response, updater: Updater<any>) => {
  const type = response.headers.get("content-type") as keyof typeof handlers;
  const handler = Object.keys(handlers).includes(type)
    ? handlers[type]
    : handlers[TEXT_PLAIN];
  await handler(response, updater);
};

type Goto = {
  hash: string;
  pathname: string;
};

const goto = async ({ hash, pathname }: Goto, updater: Updater<any>, state = false) => {
  try {
    const response = await fetch(pathname, { headers });
    // save before loading next
    const { scrollTop } = global.document.scrollingElement!;
    const { hash: currentHash, pathname: currentPathname } = global.location;
    await handle(response, updater);
    if (state) {
      storage.new({ hash: currentHash, pathname: currentPathname, scrollTop });
      const url = response.redirected ? response.url : `${pathname}${hash}`;
      history.pushState({}, "", url);
    }
  } catch (error) {
    console.warn(error);
  }
};

const submit = async (pathname: string, body: any, method: string, updater: Updater<any>) => {
  try {
    const response = await fetch(pathname, { body, headers, method });
    if (response.redirected) {
      await go(response.url, updater);
      return;
    }
    await handle(response, updater);
  } catch (error) {
    console.warn(error);
  }
};

const go = async (href: string, updater: Updater<any>, event?: Event) => {
  const url = new URL(href);
  const { hash, pathname } = url;
  const current = global.location.pathname;
  // hosts must match
  if (url.host === global.location.host) {
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
    if (hash !== global.location.hash) {
      const { scrollTop } = global.document.scrollingElement!;
      storage.new({
        hash: global.location.hash,
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
  global.addEventListener("load", _ => {
    history.scrollRestoration = "manual";
    if (global.location.hash !== "") {
      scroll_hash(global.location.hash);
    }
  });

  global.addEventListener("beforeunload", _ => {
    history.scrollRestoration = "auto";
  });

  global.addEventListener("popstate", _ => {
    const state = storage.peek() ?? { scrollTop: 0 };
    const { pathname } = global.location;

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

    goto(global.location, props =>
      updater(props, () => scroll(0, scrollTop ?? 0)));
  });

  global.addEventListener("click", event => {
    const target = (event.target as HTMLElement).closest("a");
    if (target?.tagName === "A" && target.href !== "") {
      go(target.href, updater, event);
    }
  });

  global.addEventListener("submit", (event) => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;

    const { enctype } = target;
    const action = target.action ?? global.location.pathname;
    const url = new URL(action);
    const data = new FormData(target);
    const form = enctype === MULTIPART_FORM_DATA
      ? data
      : new URLSearchParams(data as any);
    submit(url.pathname, form, target.method, updater);
  });
};
