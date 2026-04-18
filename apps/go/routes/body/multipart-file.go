//go:build js && wasm

package main

import (
	"github.com/primate-run/go/route"
	"strconv"
)

var _ = route.With{ContentType: route.Multipart}.Post(func(request route.Request) any {
	multipart, err := request.Body.Multipart()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}

	var baz int64
	if s, ok := multipart.Form["baz"].(string); ok {
		if v, err := strconv.ParseInt(s, 10, 64); err == nil {
			baz = v
		}
	}

	foo, _ := multipart.Form["foo"].(string)

	var name, typ, content string
	var size int64
	for _, f := range multipart.Files {
		if f.Field == "greeting" {
			name = f.Name
			typ = f.Type
			size = f.Size
			content = string(f.Bytes)
			break
		}
	}

	return map[string]any{
		"baz": baz,
		"foo": foo,
		"greeting": map[string]any{
			"name":    name,
			"size":    size,
			"type":    typ,
			"content": content,
		},
	}
})
