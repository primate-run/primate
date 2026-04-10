import navigate from "#client/navigate";
import type { Updater } from "#client/root";
import root from "#client/root";
import storage from "#client/storage";
import submit from "#client/submit";
import http from "@rcompat/http";
import type { Dict } from "@rcompat/type";

export default <T extends Dict>(u: Updater<T>) => {
  root.set(u);

  const { location, history } = globalThis;

  if (document.contentType === "application/json") {
    location.reload();
    return;
  }

  globalThis.addEventListener("pageshow", event => {
    if (event.persisted) location.reload();
  });

  globalThis.addEventListener("load", _ => {
    history.scrollRestoration = "manual";
    if (location.hash !== "") navigate.scroll_hash(location.hash);
  });

  globalThis.addEventListener("beforeunload", _ => {
    history.scrollRestoration = "auto";
  });

  globalThis.addEventListener("popstate", () => {
    const state = storage.peek() ?? { scrollTop: 0 };
    const { pathname } = location;
    let { scrollTop } = state;

    if (state.stop) {
      storage.back();
      state.hash
        ? navigate.scroll_hash(state.hash)
        : globalThis.scrollTo(0, state.scrollTop);
      return;
    }

    const back = state.pathname === pathname;
    back ? storage.back() : (scrollTop = storage.forward().scrollTop);

    navigate.goto(globalThis.location, false,
      () => globalThis.scrollTo(0, scrollTop ?? 0));
  });

  globalThis.addEventListener("click", event => {
    const target = (event.target as HTMLElement).closest("a");
    if (target?.tagName === "A" && target.href !== "") {
      navigate.go(target.href, event);
    }
  });

  globalThis.addEventListener("submit", async event => {
    event.preventDefault();
    const target = event.target as HTMLFormElement;
    const { enctype } = target;
    const action = target.action ?? location.pathname;
    const url = new URL(action);
    const data = new FormData(target);
    const form = enctype === http.MIME.MULTIPART_FORM_DATA
      ? data
      : new URLSearchParams(data as any);
    try {
      await submit(url.pathname, form, target.method);
    } catch (error) {
      console.warn(error);
    }
  });
};
