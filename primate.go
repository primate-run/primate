package primate

import "encoding/json"
import "syscall/js"

func try_map(array []Object[any], position uint8, fallback Object[any]) Object[any] {
	if len(array) <= int(position) {
		return fallback
	}
	return array[position]
}

func try_int(array []int, position uint8, fallback int) int {
	if len(array) <= int(position) {
		return fallback
	}
	return array[position]
}

func serialize(data map[string]any) string {
	if data == nil {
		return ""
	}

	serialized, err := json.Marshal(data)
	if err != nil {
		return ""
	}

	return string(serialized)
}

type Object[T any] map[string]T
type Array[T any] []T
type Props = Object[any]
type Options = Object[any]
type SessionData = Object[any]

type SessionType struct {
	Id     string
	Exists bool
	Create func(SessionData)
	Get    func() SessionData
	Try    func() SessionData
	Set    func(SessionData)
	Delete func()
}

func Session() SessionType {
	var session = js.Global().Get("PRMT_SESSION")

	data := make(Object[any])
	json.Unmarshal([]byte(session.Get("data").String()), &data)

	return SessionType{
		session.Get("id").String(),
		session.Get("exists").Bool(),
		func(data SessionData) {
			serialized, _ := json.Marshal(data)
			session.Get("create").Invoke(string(serialized))
		},
		func() {
			data := make(Object[any])
			json.Unmarshal([]byte(session.Get("get").String()), &data)
			return data
		},
		func() {
			data := make(Object[any])
			json.Unmarshal([]byte(session.Get("try").String()), &data)
			return data
		},
		func(data SessionData) {
			serialized, _ := json.Marshal(data)
			session.Get("set").Invoke(string(serialized))
		},
		func() {
			session.Get("delete").Invoke()
		},
	}
}

func View(component string, props Props, options ...Options) any {
	var serde_props = serialize(props)

	var serde_options = serialize(try_map(options, 0, Object[any]{}))

	return js.FuncOf(func(this js.Value, args []js.Value) any {
		return map[string]any{
			"handler":   "view",
			"component": component,
			"props":     serde_props,
			"options":   serde_options,
		}
	})
}

func Redirect(location string, ints ...int) any {
	var status = try_int(ints, 0, 302)

	return js.FuncOf(func(this js.Value, args []js.Value) any {
		return map[string]any{
			"handler":  "redirect",
			"location": location,
			"status":   status,
		}
	})
}

func Error(options ...Options) any {
	var serde_options = serialize(try_map(options, 0, Object[any]{}))

	return js.FuncOf(func(this js.Value, args []js.Value) any {
		return map[string]any{
			"handler": "error",
			"options": serde_options,
		}
	})
}
