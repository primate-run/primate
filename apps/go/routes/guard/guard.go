package main

import "github.com/primate-run/go/route"

var _ = route.Get(func(_ route.Request) any {
	return nil
})
