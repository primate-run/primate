package main

import (
	"github.com/primate-run/go/response"
	"github.com/primate-run/go/route"
)

var _ = route.Get(func(_ route.Request) any {
	return response.Redirect("/account")
})

var _ = route.Post(func(_ route.Request) any {
	return response.Redirect("/login", 303)
})
