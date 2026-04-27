import type { Dict, JSONValue } from "@rcompat/type";

type ContentTypeMap = {
  "application/json": JSONValue;
  "text/plain": string;
  "application/x-www-form-urlencoded": URLSearchParams | Dict<string>;
  "multipart/form-data": FormData | Dict<FormDataEntryValue>;
  "application/octet-stream": Blob;
};

export type { ContentTypeMap as default };
