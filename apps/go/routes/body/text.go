package main

import "github.com/primate-run/go/route"

var _ = route.Post(func(request route.Request) any {
	s, _ := request.Body.Text()
	return s
})
