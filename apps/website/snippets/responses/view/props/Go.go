package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(request route.Request) any {
	return response.View("Counter.jsx", core.Dict{"start": 10})
})
