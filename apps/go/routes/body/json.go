package main

import "github.com/primate-run/go/route"

var _ = route.Post(func(request route.Request) any {
	json, err := request.Body.JSON()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	return json
})
