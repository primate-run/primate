//go:build js && wasm

package main

import "github.com/primate-run/go/route"

var _ = route.With{ContentType: route.Blob}.Post(func(request route.Request) any {
	blob, err := request.Body.Blob()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}

	head := []int{}
	for i := 0; i < len(blob.Data) && i < 4; i++ {
		head = append(head, int(blob.Data[i]))
	}

	return map[string]any{
		"type": blob.Type,
		"size": len(blob.Data),
		"head": head,
	}
})
