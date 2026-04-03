#!/usr/bin/env node
import runtime from "@rcompat/runtime";
import init from "./init.js";

await init(...runtime.args);
