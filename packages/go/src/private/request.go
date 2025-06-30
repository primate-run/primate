package main

import (
	"encoding/json"
	"syscall/js"
)

type t_request func(Request) any
type t_response func(js.Value, []js.Value) any

type URL struct {
  Href string
  Origin string
  Protocol string
  Username string
  Password string
  Host string
  Hostname string
  Port string
  Pathname string
  Search string
  SearchParams map[string]any
  Hash string
}

type Request struct {
  Url URL
  Body map[string]any
  Path map[string]any
  Query map[string]any
  Headers map[string]any
  Cookies map[string]any
}

func make_url(request js.Value) URL {
  url := request.Get("url");
  search_params := make(map[string]any);
  json.Unmarshal([]byte(request.Get("search_params").String()), &search_params);

  return URL{
    url.Get("href").String(),
    url.Get("origin").String(),
    url.Get("protocol").String(),
    url.Get("username").String(),
    url.Get("password").String(),
    url.Get("host").String(),
    url.Get("hostname").String(),
    url.Get("port").String(),
    url.Get("pathname").String(),
    url.Get("search").String(),
    search_params,
    url.Get("hash").String(),
  };
}

func deserde(request js.Value, key string) map[string]any {
  properties := make(map[string]any);
  json.Unmarshal([]byte(request.Get(key).String()), &properties);

  return properties;
}

func make_request(route t_request, request js.Value) any {
  go_request := Request{
    make_url(request),
    deserde(request, "body"),
    deserde(request, "path"),
    deserde(request, "query"),
    deserde(request, "headers"),
    deserde(request, "cookies"),
  };

  response := route(go_request);
  switch response.(type) {
    case js.Func:
      return response;
    default:
      marshalled, _ := json.Marshal(response);
      return string(marshalled);
    }
}

func make_empty(route func() any) any {
  response := route();
  switch response.(type) {
    case js.Func:
      return response;
    default:
      marshalled, _ := json.Marshal(response);
      return string(marshalled);
    }
}
