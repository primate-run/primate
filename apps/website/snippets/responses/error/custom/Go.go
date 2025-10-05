package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
	return response.Error(core.Dict{"status": 500})
})
