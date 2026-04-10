import root from "#client/root";
import storage from "#client/storage";
import transport from "#client/transport";
import http from "@rcompat/http";

const headers = {
  Accept: http.MIME.APPLICATION_JSON,
};

const get_by_id_or_name = (name: string) =>
  document.getElementById(name) ?? document.getElementsByName(name)[0];

const scroll_hash = (hash: string) => {
  if (hash === "") {
    globalThis.scrollTo(0, 0);
  } else {
    get_by_id_or_name(hash.slice(1)).scrollIntoView();
  }
};

type Location = {
  hash: string;
  pathname: string;
};

async function goto(target: Location, state = false, after?: () => void) {
  try {
    const { scrollTop } = globalThis.document.scrollingElement!;
    const { location } = globalThis;
    const { requested, response } = await transport.refetch(target.pathname, { headers });

    if (transport.is_json(response)) {
      if (response.ok) root.update(await response.json());
      if (state) {
        storage.new({ hash: location.hash, pathname: location.pathname, scrollTop });
        history.pushState({}, "", `${target.pathname}${target.hash}`);
      }
      after?.();
      return;
    }
    const dest = response.type !== "opaqueredirect"
      ? requested.toString() + target.hash
      : new URL(target.pathname + target.hash, location.href).toString();
    location.assign(dest);
  } catch (error) {
    console.warn(error);
  }
}

async function go(href: string, event?: Event) {
  const url = new URL(href);
  const { hash, pathname } = url;
  const { location } = globalThis;

  if (url.host === location.host) {
    event?.preventDefault();

    if (location.pathname !== pathname) {
      await goto(url, true, () => {
        scroll_hash(hash);
        globalThis.dispatchEvent(new Event("updated"));
      });
    }

    if (location.hash !== hash) {
      const { scrollTop } = globalThis.document.scrollingElement!;
      storage.new({ hash: location.hash, pathname: location.pathname, scrollTop, stop: true });
      history.pushState(null, "", `${location.pathname}${hash}`);
      scroll_hash(hash);
    }
  }
}

const navigate = {
  go,
  goto,
  scroll_hash,
};

export default navigate;
