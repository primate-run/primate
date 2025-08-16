# Requests

Route functions accept a single parameter representing request data. This
aggregate object allows easy access to the request `body`, any `path`
parameters defined with brackets, the `query` string split into parts,
`cookies` as well as other `headers` and a reference to the `original` WHATWG
`Request` object. The aggregate nature of this object allows you to pull in what
you need using object destructuring.

|property|function|
|-|-|
|[body](#body)|the request body -- can be a string, object, or null|
|[path](#path)|the request path parameters|
|[query](#query)|the request query string, broken up into individual parts|
|[headers](#headers)|request headers|
|[cookies](#cookies)|request cookies|
|[context](#context)|initial context for the client|
|[original](#original)|the original WHATWG `Request` object|
|[url](#url)|a `URL` object representing the request url|
|[pass](#pass)|pass the request as-is to another address|

## Body

The parsed request body.

[s=request/body]

If a client sends a POST request to `/identify` using the content type
`application/json` and `{"name": "John"}` as payload, this route will respond
with 200 saying  `Hello, Donald`.

Primate will decode the body according to the `Content-Type` header used in the
request.

|Content type|Decoding|
|-|-|
|`text/plain`|body will be a string|
|`application/x-www-form-urlencoded`|decode form fields into object properties|
|`application/json`|decode JSON string using `JSON.parse`|
|`multipart/form-data`|decode form using `FormData`; files decoded as `Blob`|

## Path

## Query

## Headers

## Cookies

## Context

## Original

## URL

## Pass

## `RequestFacade` reference
[s=request/facade]
