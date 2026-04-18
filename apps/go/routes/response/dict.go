//go:build js && wasm

package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any {
	return core.Dict{"foo": "bar", "bar": 1}
})
