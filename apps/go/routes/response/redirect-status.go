package main

import (
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any {
	// moved permanently
	return response.Redirect("/redirected", 301)
})
