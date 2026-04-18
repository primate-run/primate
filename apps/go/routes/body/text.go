//go:build js && wasm

package main

import "github.com/primate-run/go/route"

var _ = route.With{ContentType: route.Text}.Post(func(request route.Request) any {
	s, err := request.Body.Text()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	return s
})
