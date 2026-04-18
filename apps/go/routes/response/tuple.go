//go:build js && wasm

package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/route"
)

// same like array
var _ = route.Get(func(_ route.Request) any {
	return core.Array[core.Dict]{{"foo": "bar"}, {"foo": 1}}
})
