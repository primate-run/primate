import route from "primate/route";
import app from "#app";
import type { Component } from "@primate/markdown";

export default route({
  get() {
    return app.view<Component>("index.md");
  },
});
