#!/usr/bin/env node
import runtime from "@rcompat/runtime";
import find from "./commands/index.js";

const [command] = runtime.args;
find(command)();
