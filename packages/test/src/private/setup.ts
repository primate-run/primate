import build from "@primate/core/build";
import runtime from "@rcompat/runtime";
import type { JSONValue } from "@rcompat/type";
import type { Element } from "happy-dom";
import { Browser } from "happy-dom";

function Selector(element: Element | null) {
  return {
    text() {
      if (element === null) return undefined;
      return element.textContent.trim();
    },
    html() {
      if (element === null) return undefined;
      return element.innerHTML.trim();
    },
    json(): JSONValue | undefined {
      if (element === null) return undefined;
      return JSON.parse(element.textContent.trim());
    },
    exists() {
      return element !== null;
    },
    hasAttribute(a: string) {
      if (element === null) return undefined;
      return element.hasAttribute(a);
    },
  };
}

export default function setup(dirname: string) {
  const ready = (async () => {
    const root = await runtime.projectRoot(dirname);
    const build_app = await build(root, { mode: "production" });
    const app = await build_app.serve();
    const browser = new Browser({
      settings: {
        enableJavaScriptEvaluation: true,
        suppressInsecureJavaScriptEnvironmentWarning: true,
      },
    });
    return { server: app, browser };
  })();

  async function close() {
    const { server, browser } = await ready;
    await browser.close();
    server.stop();
  }

  return {
    async open() {
      const { server, browser } = await ready;
      const page = browser.newPage();

      function basefetch(url: string, options?: RequestInit) {
        return globalThis.fetch(`${server.url}${url}`, options ?? {});
      }

      return {
        async goto(url: string) {
          await page.goto(`${server.url}${url}`);
          await page.waitUntilComplete();
        },
        get(selector: string) {
          return Selector(page.mainFrame.document.querySelector(selector));
        },
        async set(selector: string, value: string) {
          const el = page.mainFrame.document.querySelector(selector) as any;
          if (el === null) return;
          el.value = value;
          el.dispatchEvent(new page.mainFrame.window.Event("input", {
            bubbles: true,
          }));
          el.dispatchEvent(new page.mainFrame.window.Event("change", {
            bubbles: true,
          }));
        },
        async fetch(url: string, options?: RequestInit) {
          return basefetch(url, options);
        },
        async json(url: string) {
          return basefetch(url).then(r => r.json());
        },
        async text(url: string) {
          return basefetch(url).then(r => r.text());
        },
        async status(url: string) {
          return (await basefetch(url)).status;
        },
        async click(selector: string) {
          (page.mainFrame.document.querySelector(selector) as any)?.click();
          await page.mainFrame.waitUntilComplete();
        },
        async back() {
          page.mainFrame.window.history.back();
          await page.mainFrame.waitUntilComplete();
        },
        async forward() {
          page.mainFrame.window.history.forward();
          await page.mainFrame.waitUntilComplete();
        },
        async waitfor(fn: () => boolean, timeout = 1000) {
          const start = Date.now();
          while (Date.now() - start < timeout) {
            await page.mainFrame.waitUntilComplete();
            if (fn()) return;
            await new Promise(resolve => setTimeout(resolve, 10));
          }
          throw new Error("Timed out waiting for app state change");
        },
        pathname() {
          return page.mainFrame.window.location.pathname;
        },
        async [Symbol.asyncDispose]() {
          await page.close();
        },
        get window() {
          return page.mainFrame.window;
        },
      };
    },
    async close() {
      await close();
    },
    async [Symbol.asyncDispose]() {
      await close();
    },
  };
}
