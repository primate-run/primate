import type ClientData from "@primate/core/frontend/ClientData";
import type Dictionary from "@rcompat/type/Dictionary";
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

type Updater<T extends Dictionary> = (json: ClientData<T>, after?: () => void) => void;

const handlers = {
  [TEXT_PLAIN]: async (response: Response) => {
    // exit
    document.body.innerText = await response.text();
  },
  [APPLICATION_JSON]: async (response: Response, updater: Updater<any>) => {
    updater(await response.json());
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
  pathname: string;
  hash: string;
};

const goto = async ({ pathname, hash }: Goto, updater: Updater<any>, state = false) => {
  try {
    const response = await fetch(pathname, { headers });
    // save before loading next
    const { scrollTop } = global.document.scrollingElement!;
    const { pathname: currentPathname, hash: currentHash } = global.location;
    await handle(response, updater);
    if (state) {
      storage.new({ scrollTop, pathname: currentPathname, hash: currentHash });
      const url = response.redirected ? response.url : `${pathname}${hash}`;
      history.pushState({}, "", url);
    }
  } catch (error) {
    console.warn(error);
  }
};

const submit = async (pathname: string, body: any, method: string, updater: Updater<any>) => {
  try {
    const response = await fetch(pathname, { method, body, headers });
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
  const { pathname, hash } = url;
  const current = global.location.pathname;
  // hosts must match
  if (url.host === global.location.host) {
    // prevent event
    event?.preventDefault();

    // pathname differs
    if (current !== pathname) {
      await goto(url, props => updater(props, () => scroll_hash(hash)), true);
    }
    // different hash on same page, jump to hash
    if (hash !== global.location.hash) {
      const { scrollTop } = global.document.scrollingElement!;
      storage.new({
        stop: true,
        pathname: current,
        hash: global.location.hash,
        scrollTop,
      });
      history.pushState(null, "", `${current}${hash}`);
      scroll_hash(hash);
    }
  }
  // external redirect
};

export default <T extends Dictionary>(updater: Updater<T>) => {
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
