import type { RequestPublic } from "@primate/core";
import { createSignal } from "solid-js";

const [request, setRequest] = createSignal<RequestPublic>(undefined!);

export { request, setRequest };
