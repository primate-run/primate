package main

import "github.com/primate-run/go/route"
import "github.com/primate-run/go/pema"
import "github.com/primate-run/go/types"

var schema = pema.Schema(types.Dict{
	"baz": pema.Int(),
	"foo": pema.String(),
})

var _ = route.Get(func(r route.Request) any {
	parsed, err := r.Query.Parse(schema, true)
	if err != nil {
		return err.Error()
	}
	return parsed
})
