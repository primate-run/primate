import build from "@primate/core/build";
import runtime from "@rcompat/runtime";
import { Browser } from "happy-dom";

type Server = {
  url: string;
  stop(): void;
};

export default function setup(dirname: string) {
  const ready = (async () => {
    const fixtures = (await runtime.projectRoot(dirname)).join("fixtures");
    await build(fixtures, { mode: "production" });
    const server = await fixtures
      .join("build/server.js")
      .import("default") as Server;
    const browser = new Browser({
      settings: {
        enableJavaScriptEvaluation: true,
        suppressInsecureJavaScriptEnvironmentWarning: true,
      },
    });
    return { server, browser };
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
        select(selector: string): any {
          return page.mainFrame.document.querySelector(selector);
        },
        async fetch(url: string, options?: RequestInit) {
          return basefetch(url, options);
        },
        async json(url: string) {
          return basefetch(url).then(r => r.json());
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
