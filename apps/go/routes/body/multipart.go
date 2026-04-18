//go:build js && wasm

package main

import "github.com/primate-run/go/route"

var _ = route.With{ContentType: route.Multipart}.Post(func(request route.Request) any {
	multipart, err := request.Body.Multipart()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	return multipart.Form
})
