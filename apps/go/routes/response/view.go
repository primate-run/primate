package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any {
	return response.View("index.svelte", core.Dict{"hello": "world"})
})
