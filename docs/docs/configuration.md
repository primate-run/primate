# Configuration

Primate works out of the box with zero configuration. In some cases, you may
wish to change the defaults. The most common use case is activating additional
modules.

Configuration files are located in `config`. Anything you configure will be
merged into the defaults.

## app.ts
[s=configuration/intro]

### Options

|Option|Default|Description|
|-|-|-|
|[build](#build)|`{}`|esbuild options|
|[http.csp](#http-csp)|`{}`|
|[http.headers](#http-headers)|`{}`|default HTTP response headers|
|[http.host](#http-host)|`"localhost"`|server host|
|[http.port](#http-port)|`6161`|server port|
|[http.ssl.cert](#http-ssl-cert)|`undefined`|path to SSL certificate|
|[http.ssl.key](#http-ssl-key)|`undefined`|path to SSL private key|
|[http.static.root](#http-static-root)|`"/"`|web path of static assets|
|[modules](#modules)|`[]`|extension modules|
|[request.body.parse](#request-body-parse)|`true`|parse request body|

### build

Options to be passed to the esbuild builder. The following properties will be
overridden.

| | |
|-|-|
|`outdir`|set to `build` inside project root|
|`stdin.resolveDir`|set to project root|
|`tsconfigRaw`|preset|

### http.csp
The Content Security Policy (CSP) to be used.

Example of a restrictive policy.

```js
{
// all content must come from own origin, excluding subdomains
"default-src": ["'self'"],
// styles must come from own origin, excluding subdomains
"style-src": ["'self'"],
// disallow <object>, <embed> and <applet> elements
"object-src": ["'none'"],
// disallow embedding
"frame-ancestors": ["'none'"],
// all form submissions must be to own origin
"form-action": ["'self'"],
// allow only own origin in <base>
"base-uri": ["'self'"],
}

```
### http.headers
HTTP headers to be used when generating requests using the `view` handler.

### http.host
The HTTP host to be used. This value is directly passed to the runtime.

### http.port
The HTTP port to be used. This value is directly passed to the runtime.

### http.ssl.cert
Path to SSL certificate. If this property and `http.ssl.key` are set and
point to a valid key/certificate pair, Primate will use https instead of http.
If specified as a relative path, will be relative to project root.

### http.ssl.key
Path to SSL key. If `http.ssl.cert` and this property are set and point to a
valid key/certificate pair, Primate will use https instead of http. If
specified as a relative path, will be relative to project root.

### http.static.root
The path at which to serve static assets (those located in the `static`
directory). Static assets take precedence over routes. This option allows you
to have all static assets served at a subpath, like `/public`.

### modules
Additional modules to activate at runtime.

### request.body.parse
Whether the request body should be parsed according to the content type.
Turning thisoff is useful if you're using Primate as a programmable reverse
proxy andforwarding the requests to another app. The headers, query string and
cookies will be still parsed and available to `request`, and `request.original`
will contain the untouched original request.

### Reference
[s=configuration/app]


## session.ts

## db.ts
