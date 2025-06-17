import error from "#handler/error";
import view from "#handler/view";
import { Known } from "@rcompat/http/Status";
import toBufferView from "./to-buffer-view.js";
import * as assert from "node:assert/strict";
import redirect from "#handler/redirect";
import decodeUint32LE from "./decode-uint32le.js";
import decodeString from "./decode-string.js";
import decodeJson from "./decode-json.js";
import decodeBytes from "./decode-bytes.js";
import decodeOption from "./decode-option.js";
import decodeBigUint64LE from "./decode-biguint64le.js";
import openWebsocket from "./open-websocket.js";
import Dictionary from "#frontend/Props";

type BufferViewSource = Parameters<typeof toBufferView>[0];

type MaybeRedirectionStatus = Parameters<typeof redirect>[1];

type Instantiation = import("./instantiate.js").Instantiation<any, any>;

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
    headers: Dictionary<string>;
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
    callback: (api: Instantiation) => void;
  }

const decodeResponse = (source: BufferViewSource): DecodedResponse => {
  const bufferView = toBufferView(source);
  const offset = { ptr: 0 };
  const responseKind = decodeUint32LE(offset, bufferView);

  assert.ok(
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
      const text = decodeString(offset, bufferView);
      const status = decodeUint32LE(offset, bufferView);
      const headers = decodeJson(offset, bufferView) as Dictionary<string>;
      return { type: "text", text, status, headers };
    }

    case RESPONSE_JSON:
      return { type: "json", value: decodeJson(offset, bufferView) };

    case RESPONSE_BLOB: {
      const buffer = decodeBytes(offset, bufferView);
      const contentType = decodeOption(decodeString, offset, bufferView);
      return {
        type: "blob",
        value: contentType
          ? new Blob([buffer], { type: contentType })
          : new Blob([buffer]),
      };
    }

    case RESPONSE_VIEW: {
      const viewName = decodeString(offset, bufferView);
      const viewProps = decodeJson(offset, bufferView) || void 0;
      const viewOptions = decodeJson(offset, bufferView) || void 0;
      return {
        type: "view",
        value: view(viewName, viewProps, viewOptions),
      };
    }

    case RESPONSE_ERROR: {
      const body = decodeOption(decodeString, offset, bufferView);
      const status = decodeUint32LE(offset, bufferView) as Known;
      const page = decodeOption(decodeString, offset, bufferView);
      return {
        type: "error",
        value: error({ body, status, page }),
      };
    }

    case RESPONSE_REDIRECT: {
      const to = decodeString(offset, bufferView);
      const status = decodeOption(decodeUint32LE, offset, bufferView) as MaybeRedirectionStatus;
      return {
        type: "redirect",
        value: redirect(to, status),
      }
    }

    case RESPONSE_URI: {
      const str = decodeString(offset, bufferView);
      return {
        type: "uri",
        value: new URL(str),
      };
    }

    case RESPONSE_WEB_SOCKET_UPGRADE: {
      const id = decodeBigUint64LE(offset, bufferView);
      return {
        type: "web_socket_upgrade",
        callback: openWebsocket(id),
      }
    }
  }
};

export default decodeResponse;