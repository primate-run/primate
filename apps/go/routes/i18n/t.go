//go:build js && wasm

package main

import (
	"github.com/primate-run/go/i18n"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
	return i18n.T("welcome", i18n.Vars{"name": "John", "count": 5})
})
