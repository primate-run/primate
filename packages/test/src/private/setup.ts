import fs from "@rcompat/fs";
import { Browser } from "happy-dom";
import build from "primate/build";

type Server = {
  url: string;
  stop(): void;
};

export default function setup(dirname: string) {
  const ready = (async () => {
    const fixtures = (await fs.project.root(dirname)).join("fixtures");
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

  return {
    async open() {
      const { server, browser } = await ready;
      const page = browser.newPage();

      return {
        async goto(url: string) {
          await page.goto(`${server.url}${url}`);
          await page.waitUntilComplete();
        },
        select(selector: string): any {
          return page.mainFrame.document.querySelector(selector);
        },
        async fetch(url: string) {
          const res = await globalThis.fetch(`${server.url}${url}`);
          return res.json();
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
      const { server, browser } = await ready;
      await browser.close();
      server.stop();
    },

  };
}
