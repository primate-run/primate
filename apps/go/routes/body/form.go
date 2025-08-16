package main

func Post(request Request) any {
  var m map[string]any
  if err := request.Body.Fields(&m); err != nil {
    return map[string]any{"error": err.Error()}
  }
  return m
}
