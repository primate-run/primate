import fs from "@rcompat/fs";
import { Browser } from "happy-dom";
import build from "primate/build";

type Server = {
  url: string;
  stop(): void;
};

export default async function setup(dirname: string) {
  const fixtures = (await fs.project.root(dirname)).join("fixtures");

  await build(fixtures, { mode: "production" });

  const server = await fixtures.join("build/server.js").import("default") as Server;

  const browser = new Browser({
    settings: {
      enableJavaScriptEvaluation: true,
      suppressInsecureJavaScriptEnvironmentWarning: true,
    },
  });

  const page = browser.newPage();

  async function goto(url: string) {
    await page.goto(`${server.url}${url}`);
    await page.waitUntilComplete();
  }

  async function click(selector: "button") {
    page.mainFrame.document.querySelector(selector)?.click();
    await page.mainFrame.waitUntilComplete();
  }

  async function back() {
    page.mainFrame.window.history.back();
    await page.mainFrame.waitUntilComplete();
  }

  async function forward() {
    page.mainFrame.window.history.forward();
    await page.mainFrame.waitUntilComplete();
  }

  async function waitfor(fn: () => boolean, timeout = 1000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      await page.mainFrame.waitUntilComplete();
      if (fn()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    throw new Error("Timed out waiting for app state change");
  }

  async function close() {
    await browser.close();
    server.stop();
  }

  return {
    select(selector: string) {
      return page.mainFrame.document.querySelector(selector);
    },
    goto,
    click,
    back,
    forward,
    waitfor,
    pathname() {
      return page.mainFrame.window.location.pathname;
    },
    close,
  };
}
