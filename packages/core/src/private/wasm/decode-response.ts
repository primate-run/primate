import error from "#response/error";
import redirect from "#response/redirect";
import type ResponseFunction from "#response/ResponseFunction";
import view from "#response/view";
import decodeBytes from "#wasm/decode-bytes";
import decodeJson from "#wasm/decode-json";
import decodeOption from "#wasm/decode-option";
import decodeString from "#wasm/decode-string";
import type Instantiation from "#wasm/Instantiation";
import openWebsocket from "#wasm/open-websocket";
import assert from "@rcompat/assert";
import type BufferView from "@rcompat/bufferview";
import type ValidStatus from "@rcompat/http/ValidStatus";
import type { Dict } from "@rcompat/type";

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
    callback: (api: Instantiation) => ResponseFunction;
    type: "web_socket_upgrade";
  }
  | {
    headers: Dict<string>;
    status?: number | undefined;
    text: string;
    type: "text";
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
  };

const decodeResponse = (source: BufferView): DecodedResponse | undefined => {
  const response_kind = source.readU32();

  assert.true(
    response_kind === RESPONSE_BLOB
    || response_kind === RESPONSE_ERROR
    || response_kind === RESPONSE_JSON
    || response_kind === RESPONSE_REDIRECT
    || response_kind === RESPONSE_TEXT
    || response_kind === RESPONSE_URI
    || response_kind === RESPONSE_VIEW
    || response_kind === RESPONSE_WEB_SOCKET_UPGRADE,
    "Invalid response kind.",
  );
  switch (response_kind) {
    case RESPONSE_TEXT: {
      const text = decodeString(source);
      const status = source.readU32();
      const headers = decodeJson(source) as Dict<string>;
      return { headers, status, text, type: "text" };
    }

    case RESPONSE_JSON:
      return { type: "json", value: decodeJson(source) };

    case RESPONSE_BLOB: {
      const buffer = decodeBytes(source) as Uint8Array<ArrayBuffer>;
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
      const status = source.readU32() as ValidStatus;
      const page = decodeOption(decodeString, source);
      return {
        type: "error",
        value: error({ body, page, status }),
      };
    }

    case RESPONSE_REDIRECT: {
      const to = decodeString(source);
      const status = decodeOption(source =>
        source.readU32(), source) as MaybeRedirectionStatus;
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
        callback: openWebsocket(id),
        type: "web_socket_upgrade",
      };
    }
  }
};

export default decodeResponse;
