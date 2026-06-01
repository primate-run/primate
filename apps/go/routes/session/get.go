//go:build js && wasm

package main

import (
	"github.com/primate-run/go/route"
	"github.com/primate-run/go/session"
)

var _ = route.Get(func(_ route.Request) any {
	data := session.Try()
	if len(data) == 0 {
		return nil
	}
	return data
})
