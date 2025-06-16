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

type BufferViewSource = Parameters<typeof toBufferView>[0];

type MaybeRedirectionStatus = Parameters<typeof redirect>[1];

const RESPONSE_STRING = 0 as const;
const RESPONSE_JSON = 1 as const;
const RESPONSE_BLOB = 2 as const;
const RESPONSE_VIEW = 3 as const;
const RESPONSE_ERROR = 4 as const;
const RESPONSE_REDIRECT = 5 as const;
const RESPONSE_URI = 6 as const;

const decodeResponse = (source: BufferViewSource) => {
  const bufferView = toBufferView(source);
  const offset = { ptr: 0 };
  const responseKind = decodeUint32LE(offset, bufferView);

  assert.ok(
    responseKind === RESPONSE_BLOB
    || responseKind === RESPONSE_ERROR
    || responseKind === RESPONSE_JSON
    || responseKind === RESPONSE_REDIRECT
    || responseKind === RESPONSE_STRING
    || responseKind === RESPONSE_URI
    || responseKind === RESPONSE_VIEW,
    "Invalid response kind.",
  );

  switch (responseKind) {
    case RESPONSE_STRING:
      return decodeString(offset, bufferView);

    case RESPONSE_JSON:
      return decodeJson(offset, bufferView);

    case RESPONSE_BLOB: {
      const buffer = decodeBytes(offset, bufferView);
      const contentType = decodeOption(decodeString, offset, bufferView);
      return contentType
        ? new Blob([buffer], { type: contentType })
        : new Blob([buffer]);
    }

    case RESPONSE_VIEW: {
      const viewName = decodeString(offset, bufferView);
      const viewProps = decodeJson(offset, bufferView) || void 0;
      const viewOptions = decodeJson(offset, bufferView) || void 0;
      return view(viewName, viewProps, viewOptions);
    }

    case RESPONSE_ERROR: {
      const body = decodeOption(decodeString, offset, bufferView);
      const status = decodeUint32LE(offset, bufferView) as Known;
      const page = decodeOption(decodeString, offset, bufferView);
      return error({ body, status, page });
    }

    case RESPONSE_REDIRECT: {
      const to = decodeString(offset, bufferView);
      const status = decodeOption(decodeUint32LE, offset, bufferView) as MaybeRedirectionStatus;
      return redirect(to, status);
    }

    case RESPONSE_URI: {
      const str = decodeString(offset, bufferView);
      return new URL(str);
    }
  }
};

export default decodeResponse;