import app from "@/config/app";
import type { Component } from "@primate/markdown";
import route from "primate/route";

export default route({
  get() {
    return app.views.get<Component>("index.md");
  },
});
