package main

import (
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Post(func(request route.Request) any {
	return response.Text("Hello from Go!", map[string]any{"status": 201})
})
