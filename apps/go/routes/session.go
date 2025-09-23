package main

import (
	"github.com/primate-run/go/core"
	"github.com/primate-run/go/route"
	"github.com/primate-run/go/session"
)

var _ = route.Get(func(_ route.Request) any {
	session.Create(core.Dict{"foo": "bar"})

	return session.Get()
})
