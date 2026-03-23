package main

import (
	"fmt"
	"github.com/primate-run/go/route"
)

var _ = route.Post(func(request route.Request) any {
	json, err := request.Body.JSON()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}
	name, _ := json["name"].(string)

	return fmt.Sprintf("Hello, %s", name)
})
