import error from "#handler/error";
import redirect from "#handler/redirect";
import view from "#handler/view";
import type ResponseFunction from "#ResponseFunction";
import assert from "@rcompat/assert";
import type BufferView from "@rcompat/bufferview";
import type { Known } from "@rcompat/http/Status";
import type Dict from "@rcompat/type/Dict";
import decodeBytes from "./decode-bytes.js";
import decodeJson from "./decode-json.js";
import decodeOption from "./decode-option.js";
import decodeString from "./decode-string.js";
import type { Instantiation } from "./instantiate.js";
import openWebsocket from "./open-websocket.js";

type MaybeRedirectionStatus = Parameters<typeof redirect>[1];

const RESPONSE_TEXT = 0 as const;
const RESPONSE_JSON = 1 as const;
const RESPONSE_BLOB = 2 as const;
const RESPONSE_VIEW = 3 as const;
const RESPONSE_ERROR = 4 as const;
const RESPONSE_REDIRECT = 5 as const;
const RESPONSE_URI = 6 as const;
const RESPONSE_WEB_SOCKET_UPGRADE = 7 as const;

type DecodedResponse =
  | {
    type: "text";
    text: string;
    status?: number | undefined;
    headers: Dict<string>;
  }
  | {
    type:
      | "blob"
      | "error"
      | "json"
      | "redirect"
      | "uri"
      | "view";
    value: any;
  }
  | {
    type: "web_socket_upgrade";
    callback: (api: Instantiation) => ResponseFunction;
  };

const decodeResponse = (source: BufferView): DecodedResponse | undefined => {
  const responseKind = source.readU32();

  assert(
    responseKind === RESPONSE_BLOB
    || responseKind === RESPONSE_ERROR
    || responseKind === RESPONSE_JSON
    || responseKind === RESPONSE_REDIRECT
    || responseKind === RESPONSE_TEXT
    || responseKind === RESPONSE_URI
    || responseKind === RESPONSE_VIEW
    || responseKind === RESPONSE_WEB_SOCKET_UPGRADE,
    "Invalid response kind.",
  );
  switch (responseKind) {
    case RESPONSE_TEXT: {
      const text = decodeString(source);
      const status = source.readU32();
      const headers = decodeJson(source) as Dict<string>;
      return { type: "text", text, status, headers };
    }

    case RESPONSE_JSON:
      return { type: "json", value: decodeJson(source) };

    case RESPONSE_BLOB: {
      const buffer = decodeBytes(source);
      const contentType = decodeOption(decodeString, source);
      return {
        type: "blob",
        value: contentType
          ? new Blob([buffer], { type: contentType })
          : new Blob([buffer]),
      };
    }

    case RESPONSE_VIEW: {
      const name = decodeString(source);
      const props = decodeJson(source) || void 0;
      const options = decodeJson(source) || void 0;
      return {
        type: "view",
        value: view(name, props, options),
      };
    }

    case RESPONSE_ERROR: {
      const body = decodeOption(decodeString, source);
      const status = source.readU32() as Known;
      const page = decodeOption(decodeString, source);
      return {
        type: "error",
        value: error({ body, status, page }),
      };
    }

    case RESPONSE_REDIRECT: {
      const to = decodeString(source);
      const status = decodeOption(source => source.readU32(), source) as MaybeRedirectionStatus;
      return {
        type: "redirect",
        value: redirect(to, status),
      };
    }

    case RESPONSE_URI: {
      const str = decodeString(source);
      return {
        type: "uri",
        value: new URL(str),
      };
    }

    case RESPONSE_WEB_SOCKET_UPGRADE: {
      const id = source.readU64();
      return {
        type: "web_socket_upgrade",
        callback: openWebsocket(id),
      };
    }
  }
};

export default decodeResponse;
