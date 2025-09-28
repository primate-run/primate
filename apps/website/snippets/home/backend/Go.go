package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any {
	posts := core.Array[core.Dict]{core.Dict{
		"id":    1,
		"title": "First post",
	}}

	return response.View("Index.jsx", core.Dict{
		"posts": posts,
	})
})
