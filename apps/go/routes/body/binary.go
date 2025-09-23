package main

import "github.com/primate-run/go/route"

var _ = route.Post(func(request route.Request) any {
	data, mime, err := request.Body.Binary()
	if err != nil {
		return map[string]any{"error": err.Error()}
	}

	head := []int{}
	for i := 0; i < len(data) && i < 4; i++ {
		head = append(head, int(data[i]))
	}

	return map[string]any{
		"type": mime,
		"size": len(data),
		"head": head,
	}
})
