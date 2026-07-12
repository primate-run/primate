import type http from "@rcompat/http";
import type { AsyncType, ObjectType } from "pema";
import type { Parsed } from "pema";

type MIME = Omit<typeof http.MIME, "resolve" | "extension">;
type MIMEValue = MIME[keyof MIME];
type BodySchema = Parsed<unknown> | AsyncType;

type RouteOptions = {
  contentType?: MIMEValue;
  body?: BodySchema;
  path?: ObjectType | AsyncType;
};

export type { RouteOptions as default };
