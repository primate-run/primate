import error from "#handler/error";
import view from "#handler/view";
import { Known } from "@rcompat/http/Status";
import toBufferView from "./to-buffer-view.js";
import * as assert from "node:assert/strict";
import redirect from "#handler/redirect";

type Offset = { ptr: number };

type BufferView = ReturnType<typeof toBufferView>;
type BufferViewSource = Parameters<typeof toBufferView>[0];

type MaybeRedirectionStatus = Parameters<typeof redirect>[1];

const SIZE_I32 = 4;
const RESPONSE_STRING = 0 as const;
const RESPONSE_JSON = 1 as const;
const RESPONSE_BLOB = 2 as const;
const RESPONSE_VIEW = 3 as const;
const RESPONSE_ERROR = 4 as const;
const RESPONSE_REDIRECT = 5 as const;
const RESPONSE_URI = 6 as const;

const NONE = 0;
const SOME = 1;

type Decoder<T> = (offset: Offset, source: BufferView) => T;

const decoder = new TextDecoder();

const decodeUint32LE = (offset: Offset, source: BufferView): number => {
  const ptr = offset.ptr;
  const next = ptr + SIZE_I32;
  assert.ok(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  return source.view.getUint32(ptr, true);
};

const decodeBytes = (offset: Offset, source: BufferView): Uint8Array => {
  const bytesSize = decodeUint32LE(offset, source);

  // pointer math and checks
  const ptr = offset.ptr;
  const next = ptr + bytesSize;
  assert.ok(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;

  return source.buffer.slice(ptr, next);
}

const decodeString = (offset: Offset, source: BufferView): string => {
  const stringSize = decodeUint32LE(offset, source);

  // pointer math and checks
  const ptr = offset.ptr;
  const next = ptr + stringSize;
  assert.ok(next <= source.byteLength, "Index out of bounds.");
  offset.ptr = next;
  
  // get the string using a decoder
  return decoder.decode(source.buffer.subarray(ptr, next));
};

const decodeJson = (offset: Offset, source: BufferView) =>
    JSON.parse(decodeString(offset, source));

const decodeOption = <T>(kind: Decoder<T>, offset: Offset, source: BufferView): T | undefined => {
  const option = decodeUint32LE(offset, source);
  assert.ok(option === NONE || option === SOME, "Error decoding option, invalid option value.");
  return option === SOME
    ? kind(offset, source)
    : void 0;
};

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
      const viewProps = decodeJson(offset, bufferView);
      const viewOptions = decodeJson(offset, bufferView);
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