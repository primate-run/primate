import route from "primate/route";
import app from "#app";
import type { Component } from "@primate/markdown";

route.get(() => app.view<Component>("index.md"));
