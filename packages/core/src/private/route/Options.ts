import type http from "@rcompat/http";
import type { Parsed } from "pema";

type MIME = Omit<typeof http.MIME, "resolve" | "extension">;
type MIMEValue = MIME[keyof MIME];

type RouteOptions = {
  contentType?: MIMEValue;
  body?: Parsed<unknown>;
};

export type { RouteOptions as default };
