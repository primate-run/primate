package main

import (
	"fmt"
	"github.com/primate-run/go/route"
)

var _ = route.Post(func(request route.Request) any {
	var m map[string]any
	if err := request.Body.JSON(&m); err != nil {
		return map[string]any{"error": err.Error()}
	}
	name, _ := m["name"].(string)

	return fmt.Sprintf("Hello, %s", name)
})
