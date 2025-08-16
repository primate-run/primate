package main

import (
  "strconv"
)

func Post(request Request) any {
  // 1) Plain fields (baz, foo, greeting meta already in fields JSON)
  var fields map[string]any
  if err := request.Body.Fields(&fields); err != nil {
    return map[string]any{"error": err.Error()}
  }

  // baz: "1" -> 1 (match TS pema u8 coercion)
  var baz int64
  if s, ok := fields["baz"].(string); ok {
    if v, err := strconv.ParseInt(s, 10, 64); err == nil {
      baz = v
    }
  }

  // foo stays string
  foo, _ := fields["foo"].(string)

  // 2) File bytes (from filesSync)
  files, err := request.Body.Files()
  if err != nil {
    return map[string]any{"error": err.Error()}
  }

  // Find the "greeting" file
  var name, typ, content string
  var size int64
  for _, f := range files {
    if f.Field == "greeting" {
      name = f.Name
      typ = f.Type
      size = f.Size
      content = string(f.Bytes) // UTF-8 text file for this test
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
}
