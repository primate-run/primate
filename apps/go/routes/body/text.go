package main

func Post(request Request) any {
	s, _ := request.Body.Text()
	return s;
}
