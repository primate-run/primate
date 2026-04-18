//go:build js && wasm

package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(request route.Request) any {
	return request.Url.Pathname
})
