package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(r route.Request) any {
	if r.Query.Has("foo") {
		foo, _ := r.Query.Get("foo")
		return foo
	}
	return "foo missing"
})
