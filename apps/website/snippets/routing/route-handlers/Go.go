package main

import (
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
	return "Hello from GET!"
})

var _ = route.Post(func(request route.Request) any {
	return "Hello from POST!"
})
