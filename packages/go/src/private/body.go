package main

import (
  "encoding/json"
  "errors"
  "io"
  "sync"
  "syscall/js"
)

type Kind int

const (
  KindNone Kind = iota
  KindText
  KindJSON
  KindFields
  KindBin
)

func parseKind(s string) Kind {
  switch s {
  case "text":
    return KindText
  case "json":
    return KindJSON
  case "fields":
    return KindFields
  case "bin":
    return KindBin
  default:
    return KindNone
  }
}

type Body struct {
  jsObj js.Value
  kind  Kind

  onceText   sync.Once
  text       string
  textErr    error

  onceJSON   sync.Once
  jsonRaw    []byte
  jsonErr    error

  onceFields sync.Once
  fieldsRaw  []byte
  fieldsErr  error

  onceBin    sync.Once
  bin        []byte
  binType    string
  binErr     error
}

func NewBodyFromJS(v js.Value) *Body {
  return &Body{
    jsObj: v,
    kind:  parseKind(v.Get("type").String()),
  }
}

func (b *Body) Kind() Kind { return b.kind }

// Text => calls textSync()
func (b *Body) Text() (string, error) {
  if b.kind != KindText {
    return "", errors.New("expected text body")
  }
  b.onceText.Do(func() {
    b.text = b.jsObj.Call("textSync").String()
  })
  return b.text, b.textErr
}

// JSON => calls jsonSync() (string) and unmarshals into dst
func (b *Body) JSON(dst any) error {
  if b.kind != KindJSON {
    return errors.New("expected json body")
  }
  b.onceJSON.Do(func() {
    s := b.jsObj.Call("jsonSync").String()
    b.jsonRaw = []byte(s)
  })
  if b.jsonErr != nil {
    return b.jsonErr
  }
  dec := json.NewDecoder(bytesReader(b.jsonRaw))
  return dec.Decode(dst)
}

func (b *Body) Fields(dst any) error {
  if b.kind != KindFields {
    return errors.New("expected fields body")
  }
  b.onceFields.Do(func() {
    s := b.jsObj.Call("fieldsSync").String()
    b.fieldsRaw = []byte(s)
  })
  if b.fieldsErr != nil {
    return b.fieldsErr
  }
  return json.Unmarshal(b.fieldsRaw, dst)
}

type UploadFile struct {
  Field string
  Name  string
  Type  string
  Size  int64
  Bytes []byte
}

func (b *Body) Files() ([]UploadFile, error) {
  if b.kind != KindFields {
    return nil, errors.New("expected fields body")
  }
  arr := b.jsObj.Call("filesSync")
  if arr.IsUndefined() || arr.IsNull() {
    return nil, nil
  }
  n := arr.Length()
  out := make([]UploadFile, 0, n)
  for i := 0; i < n; i++ {
    it := arr.Index(i)
    field := it.Get("field").String()
    name := it.Get("name").String()
    typ := it.Get("type").String()
    size := int64(it.Get("size").Int())
    u8 := it.Get("bytes")
    buf := make([]byte, u8.Get("length").Int())
    js.CopyBytesToGo(buf, u8)
    out = append(out, UploadFile{
      Field: field, Name: name, Type: typ, Size: size, Bytes: buf,
    })
  }
  return out, nil
}

// Binary => calls binarySync() (Uint8Array) + binaryTypeSync()
func (b *Body) Binary() (data []byte, mime string, err error) {
  if b.kind != KindBin {
    return nil, "", errors.New("expected binary body")
  }
  b.onceBin.Do(func() {
    u8 := b.jsObj.Call("binarySync") // Uint8Array
    n := u8.Get("length").Int()
    buf := make([]byte, n)
    js.CopyBytesToGo(buf, u8)
    b.bin = buf
    b.binType = b.jsObj.Call("binaryTypeSync").String()
  })
  return b.bin, b.binType, b.binErr
}

// tiny reader to avoid bytes import
type byteReader []byte
func (r byteReader) Read(p []byte) (int, error) {
  n := copy(p, r)
  if n < len(r) { return n, nil }
  return n, io.EOF
}
func bytesReader(b []byte) io.Reader { return byteReader(b) }
