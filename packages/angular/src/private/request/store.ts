import type { RequestPublic } from "@primate/core";
import { signal } from "@angular/core";

const request = signal<RequestPublic>(undefined!);

export default request;
