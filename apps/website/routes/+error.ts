import { view } from "primate";

export default request => view("Errorpage.svelte", { app: request.config });
