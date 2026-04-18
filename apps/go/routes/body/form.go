//go:build js && wasm

package main

import "github.com/primate-run/go/route"

var _ = route.With{ContentType: route.Form}.Post(func(request route.Request) any {
	form, err := request.Body.Form()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	return form
})
